"""Install or remove the 8BitBoy menu navigation mod."""
import argparse
import hashlib
import os
from pathlib import Path
import shutil
import zipfile

EXPECTED_SHA256 = "0738c2aefe4577c078e57780b30720f6af636b8bed5d704d06e22758eda9abc6"
MARKER = b'<script src="menu-direcional.js"></script>'
MOD = Path(__file__).with_name("menu-direcional.js")


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def is_our_package(path, original):
    try:
        with zipfile.ZipFile(path) as modified, zipfile.ZipFile(original) as clean:
            if set(modified.namelist()) != set(clean.namelist()) | {MOD.name}:
                return False
            for name in clean.namelist():
                data = clean.read(name)
                if name == "index.html":
                    data = data.replace(b"</body>", MARKER + b"</body>")
                if modified.read(name) != data:
                    return False
            return modified.read(MOD.name) == MOD.read_bytes()
    except (OSError, KeyError, zipfile.BadZipFile):
        return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("install", "remove"))
    parser.add_argument("--game-dir", type=Path, required=True, help="Game folder containing package.nw")
    args = parser.parse_args()
    package = args.game_dir / "package.nw"
    backup = args.game_dir / "package.nw.original-8bitboy-menu-mod"
    if not package.is_file():
        raise SystemExit("package.nw was not found in the specified folder.")
    if not backup.exists():
        if sha256(package) != EXPECTED_SHA256:
            raise SystemExit("Unexpected original package. No files were changed.")
        if args.action == "remove":
            raise SystemExit("The game appears unmodified; no backup was found.")
        shutil.copy2(package, backup)
    if sha256(backup) != EXPECTED_SHA256:
        raise SystemExit("Unexpected backup. No files were changed.")
    if sha256(package) != EXPECTED_SHA256 and not is_our_package(package, backup):
        raise SystemExit("The package has unrecognized changes. No files were changed.")
    temp = package.with_name("package.nw.menu-mod-tmp")
    if temp.exists():
        raise SystemExit("Temporary file already exists. No files were changed.")
    try:
        if args.action == "remove":
            shutil.copy2(backup, temp)
        else:
            with zipfile.ZipFile(backup) as original, zipfile.ZipFile(temp, "x") as output:
                for item in original.infolist():
                    data = original.read(item.filename)
                    if item.filename == "index.html":
                        if data.count(b"</body>") != 1:
                            raise ValueError("Unexpected index.html")
                        data = data.replace(b"</body>", MARKER + b"</body>")
                    output.writestr(item, data)
                output.writestr(MOD.name, MOD.read_bytes(), compress_type=zipfile.ZIP_DEFLATED)
            with zipfile.ZipFile(temp) as check:
                if check.testzip() is not None or MARKER not in check.read("index.html"):
                    raise ValueError("Package verification failed")
        os.replace(temp, package)
    finally:
        if temp.exists():
            temp.unlink()
    print("Mod installed." if args.action == "install" else "Original package restored.")


if __name__ == "__main__":
    main()
