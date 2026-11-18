#!/usr/bin/env python3
"""Prova isolada para Story COM link, sem mudar a fila da Valenza.

Sem argumentos, faz exclusivamente simulação (nenhum login, rede ou publicação).
A publicação de teste exige conta PESSOAL @wesleyvmartins, ação explícita e é apagada após
verificação. NUNCA publicar na conta principal valenza.parfumsimportados.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
import urllib.request
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

OFFICIAL_USER = "valenza.parfumsimportados"
PERSONAL_TEST_USER = "wesleyvmartins"
ALLOWED_DESTINATIONS = {"valenzaparfums.com.br", "www.valenzaparfums.com.br"}
ALLOWED_IMAGES = {"valenza-social-admin.aureaperfumes.workers.dev"}


def load_manifest(path: Path) -> dict:
    row = json.loads(path.read_text(encoding="utf-8"))
    if row.get("kind") != "STORY" or row.get("status") != "approved":
        raise ValueError("Somente um Story previamente aprovado pode ser usado.")
    image = urlparse(row["image"])
    target = urlparse(row["product_url"])
    if image.scheme != "https" or image.hostname not in ALLOWED_IMAGES:
        raise ValueError("Foto deve vir da biblioteca oficial aprovada da Valenza.")
    if target.scheme != "https" or target.hostname not in ALLOWED_DESTINATIONS:
        raise ValueError("Destino deve ser um produto do domínio oficial Valenza.")
    if not target.path.startswith("/perfume/"):
        raise ValueError("Teste exige link de produto, não a página inicial.")
    return row


def test_link(manifest: dict) -> str:
    """Usa tags internas para NÃO atribuir clique de teste a campanha comercial."""
    p = urlparse(manifest["product_url"])
    values = dict(parse_qsl(p.query, keep_blank_values=True))
    values.update({
        "utm_source": "valenza_interno",
        "utm_medium": "internal_test",
        "utm_campaign": "lab_story_link_" + manifest["slug"],
        "utm_content": "story_" + manifest["id"].replace("-", "")[:18],
    })
    return urlunparse(p._replace(query=urlencode(values)))


def approved_image_to_temp(url: str, directory: Path) -> Path:
    req = urllib.request.Request(url, headers={"User-Agent": "ValenzaStoryLab/1.0"})
    target = directory / "approved-story.jpg"
    with urllib.request.urlopen(req, timeout=25) as resp:
        if resp.geturl() != url:
            raise RuntimeError("Imagem redirecionada: abortar para evitar arquivo inesperado.")
        data = resp.read(10_000_001)
    if len(data) > 10_000_000 or not data.startswith(b"\xff\xd8\xff"):
        raise ValueError("Arquivo inesperado: somente JPEG aprovado até 10 MB.")
    target.write_bytes(data)
    return target


def publish_only_secondary(manifest: dict, url: str, test_username: str) -> dict:
    test_username = test_username.strip().lstrip("@").lower()
    if test_username != PERSONAL_TEST_USER:
        raise ValueError("Este teste só permite a conta pessoal @wesleyvmartins. A Valenza permanece protegida.")
    password = os.environ.get("IG_TEST_PASSWORD")
    if not password:
        raise RuntimeError(
            "IG_TEST_PASSWORD deve ser configurado LOCALMENTE para a conta pessoal do Wesley. "
            "Não envie senha nem sessão ao ChatGPT/GitHub."
        )
    try:
        from instagrapi import Client
        from instagrapi.types import StoryLink
    except ImportError as e:
        raise RuntimeError("Instale instagrapi >=3.2 com correção de StoryLink.") from e

    cl = Client()
    # Autenticação apenas na conta pessoal do Wesley, sem usar tokens do Meta/Direct.
    cl.login(test_username, password)
    actual = str(cl.account_info().username).lower()
    if actual != PERSONAL_TEST_USER or actual == OFFICIAL_USER:
        raise RuntimeError("Login não corresponde à conta pessoal autorizada do Wesley.")

    with tempfile.TemporaryDirectory(prefix="valenza-story-lab-") as folder:
        image = approved_image_to_temp(manifest["image"], Path(folder))
        story = None
        try:
            story = cl.photo_upload_to_story(
                image, caption="", links=[StoryLink(webUri=url)]
            )
            readback = cl.story_info(int(story.pk), use_cache=False)
            linked = [
                str(getattr(entry, "webUri", "") or "")
                for entry in getattr(readback, "links", [])
            ]
            ok = url in linked
            result = {
                "uploaded_to_personal": True,
                "verified_link": ok,
                "story_pk": str(story.pk),
                "finding": "LINK_OK" if ok else "LINK_NOT_FOUND_IN_READBACK",
            }
        finally:
            # Nunca mexe em posts da conta comercial; apaga apenas o Story do teste.
            if story is not None:
                deleted = cl.story_delete(int(story.pk))
                if not deleted:
                    raise RuntimeError("O Story de teste não pôde ser excluído da conta pessoal.")
    result["story_deleted_after_test"] = True
    return result


def main() -> int:
    ap = argparse.ArgumentParser(description="Laboratório isolado; padrão = simulação")
    ap.add_argument("--manifest", type=Path, default=Path(__file__).with_name("sabah-pearl-story-lab.json"))
    ap.add_argument("--publish-test", action="store_true", help="Usa apenas conta pessoal autorizada")
    ap.add_argument("--test-account", default="", help="Username de conta pessoal, nunca Valenza")
    args = ap.parse_args()
    manifest = load_manifest(args.manifest)
    link = test_link(manifest)
    if not args.publish_test:
        print(json.dumps({
            "status": "DRY_RUN_OK",
            "action": "Nenhuma publicação e nenhum login realizados",
            "source_story": manifest["title"],
            "approved_image": manifest["image"],
            "link_target": link,
            "production_schedule_changed": False,
            "official_account_used": False,
        }, ensure_ascii=False, indent=2))
        return 0
    if args.test_account.strip().lstrip("@").lower() != PERSONAL_TEST_USER:
        raise ValueError("Somente @wesleyvmartins pode publicar o teste. A conta Valenza está bloqueada.")
    print(json.dumps(publish_only_secondary(manifest, link, args.test_account), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print("TESTE INTERROMPIDO: " + str(exc), file=sys.stderr)
        raise SystemExit(1)
