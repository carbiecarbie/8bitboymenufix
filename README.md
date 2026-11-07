# 8BitBoy D-pad Menu Navigation

A small mod for the Steam Windows version of **8BitBoy 1.5.3** that lets you move between menu options with the controller's D-pad and confirm with A.

The game cursor remains visible: the mod moves it directly to a menu option instead of requiring you to steer it across the screen. The game's existing confirmation and back controls remain in use. Enable **GamePad** in the game's settings for controller gameplay.

## Installation

You need Python 3 and an existing installation of the game. The installer is designed for the original 1.5.3 `package.nw` identified by SHA-256. It does not include or download game files.

1. Close the game and download or clone this project.
2. In Steam, right-click 8BitBoy and choose **Manage → Browse local files**. Copy the folder path.
3. Open a terminal in the downloaded project folder and run:

   ```sh
   python3 install.py install --game-dir "/path/to/8BitBoy"
   ```

   On Windows, use `python` instead of `python3` if needed, and pass the Windows path in quotes. For example:

   ```powershell
   python install.py install --game-dir "D:\SteamLibrary\steamapps\common\8BitBoy"
   ```

4. Launch the game. Press the D-pad to select an option, then A to confirm.

The installer saves a copy of the original as `package.nw.original-8bitboy-menu-mod` in the game folder. It checks the original and refuses to overwrite unrecognized changes. Steam's file verification may restore the original and remove the mod.

To uninstall, close the game and run the same command with `remove` instead of `install`:

```sh
python3 install.py remove --game-dir "/path/to/8BitBoy"
```

## Compatibility and testing

Menu navigation was tested on Windows using simulated gamepad input in the main menu, save-slot selection, confirmation, difficulty selection, and pause menu. Gameplay movement was also checked. Not every screen or physical controller has been tested.

The mod has also been tested on Linux using Proton. The installer refuses game packages that do not match the supported original; other builds and mods may be incompatible.

This is an unofficial fan mod and is not affiliated with the game's developer or publisher.
