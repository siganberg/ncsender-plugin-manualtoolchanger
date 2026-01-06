# Manual Tool Changer

> **IMPORTANT DISCLAIMER:** This plugin is part of my personal ncSender project. If you choose to use it, you do so entirely at your own risk. I am not responsible for any damage, malfunction, or personal injury that may result from the use or misuse of this plugin. Use it with caution and at your own discretion.

Manual tool change workflow with Tool Length Setter (TLS) support.

## Installation

Install this plugin in ncSender through the Plugins interface.

## Features

### Tool Change Automation
- Automated M6 tool change sequence
- Separate load and unload routines with safety confirmations
- Optional RapidChangeSolo spindle-engaged tool swapping
- Same-tool change detection and skipping

### Tool Length Setter Integration
- Automated tool length probing with $TLS command
- Configurable tool setter location (X/Y/Z coordinates)
- Configurable probe parameters (seek distance, feedrate)
- Automatic tool offset management
- Optional TLS after homing

### Safety Features
- Modal dialogs for load/unload confirmation
- Visual progress indicators on buttons
- Non-closable safety dialogs during critical operations
- Clear instructions with emphasized safety warnings

### Configuration
- Tool Setter location (X/Y/Z coordinates)
- Manual Tool Change location (X/Y coordinates)
- RapidChangeSolo pocket location (X/Y/Z coordinates) - optional
- Advanced JSON-configurable parameters:
  - Z-axis positions (engagement, safe, spin-off, retreat)
  - RPM settings (load/unload)
  - Engagement feedrate
  - Tool length setter parameters

### Automatic Settings Management
- Configurable tool count
- Enables manual tool change mode when configured
- Enables TLS integration when configured
- Resets settings on plugin disable

## Usage

1. Configure the Tool Setter location using the "Grab" button while positioned at the tool setter
2. Configure the Manual Tool Change location using the "Grab" button
3. Optionally enable RapidChangeSolo and configure pocket location
4. Save configuration
5. Use M6 commands in your G-code for automated tool changes
6. Use $TLS command for tool length measurement

## Development

This plugin is part of the ncSender ecosystem: https://github.com/siganberg/ncSender

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

Copyright (C) 2024 Francis Marasigan
