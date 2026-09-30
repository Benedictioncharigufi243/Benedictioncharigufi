from dotenv import load_dotenv
load_dotenv()

import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

import bcrypt
import jwt
import requests
import json
from google import genai
from google.genai import types

genai_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://benedictioncharigufi-frontend.vercel.app",
    "https://benedictioncharigufi-ee9f-jo1ijclzt-benedictioncharigufi.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ---------- Object storage ----------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "exauce-site"
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------- Auth ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def _cookie_options(request: Request) -> dict:
    # Secure cookies are required for SameSite=None, but they do not work over
    # plain HTTP during local development.
    is_secure = request.url.scheme == "https" or os.environ.get("COOKIE_SECURE", "").lower() == "true"
    return {
        "httponly": True,
        "secure": is_secure,
        "samesite": "none" if is_secure else "lax",
        "path": "/",
    }


def set_auth_cookies(response: Response, request: Request, user_id: str, email: str):
    options = _cookie_options(request)
    response.set_cookie("access_token", create_access_token(user_id, email), max_age=900, **options)
    response.set_cookie("refresh_token", create_refresh_token(user_id), max_age=604800, **options)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"_id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user.pop("password_hash", None)
    return user


class LoginInput(BaseModel):
    email: str
    password: str


@api_router.post("/auth/login")
async def login(input: LoginInput, request: Request, response: Response):
    email = input.email.lower().strip()
    identifier = f"{request.client.host}:{email}"
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        locked_until = attempts.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Trop de tentatives. Reessayez dans 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        count = (attempts.get("count", 0) if attempts else 0) + 1
        update: Dict[str, Any] = {"identifier": identifier, "count": count}
        if count >= 5:
            update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    await db.login_attempts.delete_one({"identifier": identifier})
    set_auth_cookies(response, request, user["_id"], email)
    return {"id": user["_id"], "email": email, "name": user.get("name", ""), "role": user.get("role", "admin")}


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    options = _cookie_options(request)
    response.delete_cookie("access_token", path=options["path"], secure=options["secure"], httponly=options["httponly"], samesite=options["samesite"])
    response.delete_cookie("refresh_token", path=options["path"], secure=options["secure"], httponly=options["httponly"], samesite=options["samesite"])
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["_id"], "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "admin")}


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"_id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    set_auth_cookies(response, request, user["_id"], user["email"])
    return {"ok": True}


# ---------- Content (acting profile) ----------
HERO_ACTOR = "https://images.unsplash.com/photo-1565665580796-7258b3823736?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHw0fHxkcmFtYXRpYyUyMGJsYWNrJTIwbWFsZSUyMGFjdG9yJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzkwNTc1NzY0fDA&ixlib=rb-4.1.0&q=85"
HERO_SCREENWRITER = "https://images.unsplash.com/photo-1612544409025-e1f6a56c1152?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxmaWxtJTIwc2V0JTIwYmVoaW5kJTIwc2NlbmVzJTIwZGFya3xlbnwwfHx8fDE3OTA1NzU3NjR8MA&ixlib=rb-4.1.0&q=85"
GALLERY_1 = "https://images.unsplash.com/photo-1518882570151-157128e78fa1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwyfHxkcmFtYXRpYyUyMGJsYWNrJTIwbWFsZSUyMGFjdG9yJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzkwNTc1NzY0fDA&ixlib=rb-4.1.0&q=85"
GALLERY_2 = "https://images.unsplash.com/photo-1709004915865-38bc70f4cb78?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwzfHxkcmFtYXRpYyUyMGJsYWNrJTIwbWFsZSUyMGFjdG9yJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzkwNTc1NzY0fDA&ixlib=rb-4.1.0&q=85"
GALLERY_3 = "https://images.unsplash.com/photo-1565884280295-98eb83e41c65?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwxfHxkcmFtYXRpYyUyMGJsYWNrJTIwbWFsZSUyMGFjdG9yJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzkwNTc1NzY0fDA&ixlib=rb-4.1.0&q=85"
MOOD_1 = "https://images.unsplash.com/photo-1691491918178-8a2e68b44919?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxmaWxtJTIwc2V0JTIwYmVoaW5kJTIwc2NlbmVzJTIwZGFya3xlbnwwfHx8fDE3OTA1NzU3NjR8MA&ixlib=rb-4.1.0&q=85"
MOOD_2 = "https://images.unsplash.com/photo-1728022038090-8ab88f8339bf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwyfHxmaWxtJTIwc2V0JTIwYmVoaW5kJTIwc2NlbmVzJTIwZGFya3xlbnwwfHx8fDE3OTA1NzU3NjR8MA&ixlib=rb-4.1.0&q=85"
MOOD_3 = "https://images.unsplash.com/photo-1632187981988-40f3cbaeef5e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHw0fHxmaWxtJTIwc2V0JTIwYmVoaW5kJTIwc2NlbmVzJTIwZGFya3xlbnwwfHx8fDE3OTA1NzU3NjR8MA&ixlib=rb-4.1.0&q=85"

DEFAULT_CONTENT: Dict[str, Any] = {
    "name": "Exauce Baleke",
    "role_line": "Acteur - Scenariste",
    "location_line": "Goma - Kinshasa, RDC",
    "intro": "Du theatre de rue de Goma aux plateaux de Kinshasa, je construis des personnages avec le corps, la voix et la memoire de ceux qui m'ont precede.",
    "bio": "Forme au combat scenique et a la boxe, je passe de l'ecriture au plateau avec la meme exigence : des histoires enracinees, des corps qui parlent. Quatre langues, plusieurs accents, une seule ambition - porter le recit congolais sur tous les ecrans.",
    "hero_actor_image": HERO_ACTOR,
    "hero_scenario_image": HERO_SCREENWRITER,
    "portrait_main": HERO_ACTOR,
    "demo_reel_url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    "gallery": [
        {"url": HERO_ACTOR, "label": "Portrait neutre"},
        {"url": GALLERY_1, "label": "Sourire"},
        {"url": GALLERY_2, "label": "Plein pied"},
        {"url": GALLERY_3, "label": "En personnage"},
    ],
    "specs": {
        "Mensurations": [["Taille", "1m82"], ["Poids", "78 kg"], ["Tour de poitrine", "102 cm"], ["Pointure", "44"]],
        "Apparence": [["Yeux", "Marron fonce"], ["Cheveux", "Noirs, courts"], ["Teint", "Fonce"], ["Barbe", "Oui, modulable"]],
        "Langues": [["Lingala", "Langue maternelle"], ["Swahili", "Langue maternelle"], ["Francais", "Courant"], ["Anglais", "Courant"]],
        "Accents": [["Congolais", "Natif"], ["Nigerian", "Confirme"], ["Rwandais", "Confirme"], ["Francais international", "Confirme"]],
        "Skills": [["Boxe", "Confirme"], ["Combat scenique", "Confirme"], ["Danse", "Ndombolo, afrobeat"], ["Moto", "Conduite confirmee"], ["Chant", "Baryton"]],
        "Mobilite": [["Base", "Goma / Kinshasa"], ["Passeport", "Valide"], ["Disponibilite", "Internationale"]],
    },
    "links": {
        "whatsapp": "243990604665",
        "email": "casting@exauce-baleke.com",
        "instagram": "https://instagram.com/",
        "imdb": "https://imdb.com/",
    },
    "cv_pdf": "",
}


class ContentUpdate(BaseModel):
    data: Dict[str, Any]


@api_router.get("/content")
async def get_content():
    doc = await db.content.find_one({"key": "main"})
    data = doc.get("data", {}) if doc else {}
    return {**DEFAULT_CONTENT, **data}


@api_router.put("/content")
async def update_content(update: ContentUpdate, user: dict = Depends(get_current_user)):
    await db.content.update_one(
        {"key": "main"},
        {"$set": {"data": update.data, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True}


# ---------- Scenarios ----------
class ScenarioIn(BaseModel):
    title: str
    genre: str = ""
    format: str = ""
    status: str = ""
    pitch: str = ""
    synopsis: str = ""
    note_intention: str = ""
    poster: str = ""
    images: List[str] = []
    treatment_pdf: str = ""
    order: int = 0


@api_router.get("/scenarios")
async def list_scenarios():
    return await db.scenarios.find({}, {"_id": 0}).sort([("order", 1), ("created_at", 1)]).to_list(200)


@api_router.post("/scenarios", status_code=201)
async def create_scenario(input: ScenarioIn, user: dict = Depends(get_current_user)):
    doc = input.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.scenarios.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/scenarios/{sid}")
async def update_scenario(sid: str, input: ScenarioIn, user: dict = Depends(get_current_user)):
    res = await db.scenarios.update_one({"id": sid}, {"$set": input.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Scenario introuvable")
    return await db.scenarios.find_one({"id": sid}, {"_id": 0})


@api_router.delete("/scenarios/{sid}")
async def delete_scenario(sid: str, user: dict = Depends(get_current_user)):
    res = await db.scenarios.delete_one({"id": sid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scenario introuvable")
    return {"ok": True}


# ---------- Uploads ----------
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"path": result["path"]}


@api_router.get("/files/{path:path}")
async def download_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, content_type = get_object(path)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=data, media_type=record.get("content_type") or content_type)


# ---------- AI (Gemini) ----------

async def sse_stream(system_message: str, prompt: str, on_done=None):
    full_text = ""
    try:
        response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_message,
            ),
        )
        full_text = response.text or ""
        yield f"data: {json.dumps({'delta': full_text})}\n\n"
    except Exception as e:
        logger.error(f"Gemini LLM error: {e}")
        yield f"data: {json.dumps({'delta': ''})}\n\n"

    yield "data: [DONE]\n\n"
    if on_done:
        try:
            await on_done(full_text)
        except Exception as e:
            logger.error(f"Chat history store failed: {e}")


SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


class ImproveInput(BaseModel):
    field: str
    text: str = ""
    title: str = ""


@api_router.post("/ai/improve")
async def ai_improve(input: ImproveInput, user: dict = Depends(get_current_user)):
    system = (
        "Tu es un script doctor et conseiller litteraire francophone, specialiste du cinema africain. "
        "Tu reecris le texte fourni pour le rendre plus percutant, cinematographique et vendeur, en francais. "
        "Tu reponds uniquement avec le texte retravaille, sans preambule, sans guillemets, sans commentaire."
    )
    label = input.field or "texte"
    if input.text.strip():
        prompt = f"Projet : {input.title or 'sans titre'}\nType de texte : {label}\n\nTexte a ameliorer :\n{input.text}"
    else:
        prompt = f"Ecris un(e) {label} percutant(e) pour le projet « {input.title or 'sans titre'} »."
    return StreamingResponse(sse_stream(system, prompt), media_type="text/event-stream", headers=SSE_HEADERS)


class ChatInput(BaseModel):
    session_id: str
    message: str


def build_chat_system(content: dict, scenarios: list) -> str:
    specs = content.get("specs") or {}
    specs_txt = "; ".join(
        f"{g} : " + ", ".join(f"{k} {v}" for k, v in rows) for g, rows in specs.items()
    )
    scen_txt = "\n".join(
        f"- {s.get('title')} ({s.get('genre')}, {s.get('format')}, {s.get('status')}) : {s.get('pitch', '')}"
        for s in scenarios
    )
    links = content.get("links") or {}
    return (
        f"Tu es l'assistant virtuel du site officiel de {content.get('name')}, acteur et scenariste base a "
        f"{content.get('location_line')}. Tu reponds en francais, de facon concise et chaleureuse, aux "
        "directeurs de casting, realisateurs et producteurs. "
        f"Profil : {content.get('intro', '')} {content.get('bio', '')} "
        f"Caracteristiques : {specs_txt}. "
        f"Projets de scenarios :\n{scen_txt}\n"
        f"Pour toute demande concrete (booking, traitement complet, lecture de scenario), oriente vers WhatsApp : "
        f"+{links.get('whatsapp', '243990604665')} ou l'email {links.get('email', '')}. "
        "Ne reponds qu'aux questions liees a l'artiste, a sa carriere et a ses projets. Maximum 120 mots."
    )


@api_router.post("/chat")
async def public_chat(input: ChatInput):
    if not input.message.strip():
        raise HTTPException(status_code=400, detail="Message vide")
    content = await get_content()
    scenarios = await db.scenarios.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    system = build_chat_system(content, scenarios)
    now = datetime.now(timezone.utc).isoformat()
    await db.chat_messages.insert_one(
        {"session_id": input.session_id, "role": "user", "content": input.message, "created_at": now}
    )
    history = await db.chat_messages.find({"session_id": input.session_id}, {"_id": 0}).sort("created_at", -1).to_list(8)
    history.reverse()
    hist_txt = "\n".join(
        ("Visiteur : " if m["role"] == "user" else "Assistant : ") + m["content"] for m in history
    )
    prompt = f"{hist_txt}\nAssistant :" if hist_txt else input.message

    async def store(answer: str):
        await db.chat_messages.insert_one(
            {
                "session_id": input.session_id,
                "role": "assistant",
                "content": answer,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    return StreamingResponse(sse_stream(system, prompt, on_done=store), media_type="text/event-stream", headers=SSE_HEADERS)



# ---------- Misc ----------
@api_router.get("/")
async def root():
    return {"message": "Exauce Baleke — Acteur & Scenariste API"}


SEED_SCENARIOS = [
    {
        "id": str(uuid.uuid4()),
        "title": "Les Cendres du Kivu",
        "genre": "Drame historique",
        "format": "Long metrage - 105 min",
        "status": "En developpement",
        "pitch": "Apres l'eruption du Nyiragongo, un jeune guide doit choisir entre sauver sa famille ou les archives cachees qui pourraient faire trembler toute la region.",
        "synopsis": "Goma, quelques jours apres l'eruption. Faustin, guide de volcan au chomage, decouvre dans les decombres de la maison familiale une mallette d'archives appartenant a son pere, ancien notaire. Ces documents compromettent de puissants notables de la region. Traque, il traverse la ville en reconstruction pour rejoindre sa femme et sa fille refugiees a Sake, tandis que la lave figee porte encore la chaleur des secrets qu'elle a reveles. Un choix s'impose : detruire la mallette et vivre, ou la livrer et risquer tout.",
        "note_intention": "Filmer Goma comme un personnage : la lave noire, la poussiere, la lumiere rasante du matin. Un recit de transmission ou la memoire d'un pere devient l'arme d'un fils.",
        "poster": MOOD_1,
        "images": [MOOD_2, GALLERY_2, HERO_SCREENWRITER],
        "treatment_pdf": "",
        "order": 1,
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Kin la Nuit",
        "genre": "Thriller",
        "format": "Serie - 8 x 52 min",
        "status": "En ecriture",
        "pitch": "Une chauffeuse de taxi nocturne devient l'oreille de toute la ville - jusqu'a la course de trop.",
        "synopsis": "Chaque nuit, Divine conduit son taxi dans Kinshasa et recueille les confidences de ses passagers : ministres, musiciens, truands, amants. Quand une passagere disparait apres lui avoir confie une preuve de corruption, Divine devient a la fois temoin et cible. De la Gombe a la cite, elle navigue entre les reseaux qui gouvernent la nuit, aidee d'un journaliste radiophonique insomniac. Chaque episode est une course ; chaque course rapproche la verite - et le danger.",
        "note_intention": "La nuit kinoise comme un personnage : neons, embouteillages, rumba lointaine. Une heroine silencieuse qui ecoute ce que la ville n'ose pas dire.",
        "poster": MOOD_2,
        "images": [MOOD_3, GALLERY_1, MOOD_1],
        "treatment_pdf": "",
        "order": 2,
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Le Dernier Round",
        "genre": "Drame sportif",
        "format": "Long metrage - 90 min",
        "status": "Pitch pret",
        "pitch": "Un ancien champion de boxe de Goma entraine en secret la fille de son rival disparu sur le ring.",
        "synopsis": "Ex-champion devenu entraineur de rue, Muhindo a jure de ne plus monter dans un gymnase depuis la mort de son rival et ami, il y a quinze ans. Quand Amina, la fille de celui-ci, lui demande de la preparer pour le championnat national, il refuse - puis cede. L'entrainement devient un face-a-face avec le passe : la nuit du drame, les dettes, les promesses brisees. A quelques semaines du combat, la verite eclate et menace de briser ce qu'ils viennent de reconstruire.",
        "note_intention": "La boxe comme langage du deuil et du pardon. Des corps filmes au plus pres, la sueur et la poussiere, entre documentaire et melodrame.",
        "poster": MOOD_3,
        "images": [GALLERY_3, MOOD_1, HERO_SCREENWRITER],
        "treatment_pdf": "",
        "order": 3,
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Sous le Volcan",
        "genre": "Drame",
        "format": "Court metrage - 20 min",
        "status": "Termine",
        "pitch": "Deux freres se retrouvent pour enterrer leur pere au pied du volcan qui a avale leur maison d'enfance.",
        "synopsis": "Alain est reste a Goma. Patient est parti pour Bruxelles. La mort de leur pere les oblige a se retrouver et a remonter ensemble, une derniere fois, la piste qui mene a l'ancienne maison, ensevelie sous la coulee. En chemin, les reproches remontent comme la chaleur du sol. Au sommet, face au cratere, les deux freres decouvrent ce que leur pere leur a laisse : pas un heritage, mais un itineraire.",
        "note_intention": "Un film de marche et de silence. Le volcan comme metaphore de ce qui gronde sous les familles - et finit parfois par les purifier.",
        "poster": HERO_SCREENWRITER,
        "images": [MOOD_3, MOOD_2, GALLERY_2],
        "treatment_pdf": "",
        "order": 4,
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
]


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "benedictioncharigufi@gmail.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "258036Ab")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "_id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin user seeded")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password reconciled")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    await seed_admin()
    if await db.scenarios.count_documents({}) == 0:
        await db.scenarios.insert_many(SEED_SCENARIOS)
        logger.info("Sample scenarios seeded")


app.include_router(api_router)




@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
