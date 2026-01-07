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
- Automated tool length probing with `$TLS` command
- Configurable tool setter location (X/Y/Z coordinates)
- Configurable probe parameters (seek distance, feedrate)
- Automatic tool offset management via G43.1
- Per-tool TLS offsets from Tool Library
- Optional automatic TLS after first `$H` (home) command

### Safety Features
- Modal dialogs for load/unload confirmation
- Non-closable safety dialogs during critical operations
- Clear instructions with Abort/Continue options
- Optional pause before unload confirmation

### Supported Commands

| Command | Description |
|---------|-------------|
| `M6 Tx` | Perform tool change to tool number x |
| `$TLS` | Run tool length setter routine |
| `$POCKET1` | Move to RapidChangeSolo pocket location |
| `$H` | Home machine (with optional automatic TLS if tool loaded) |

### Configuration Options

**Tool Setter**
- X/Y/Z location coordinates
- Seek distance (mm)
- Seek feedrate (mm/min)

**Manual Tool Change Location**
- X/Y parking coordinates for manual tool swaps

**RapidChangeSolo** (Optional)
- Enable/disable spindle-engaged tool swapping
- Pocket X/Y location and Z engagement depth
- Pause before unload option

**Tool Settings**
- Number of tools (1-98)
- Show macro commands in terminal
- Perform TLS after first HOME

### Advanced Settings (JSON only)

These settings can be modified directly in the plugin settings JSON:

```json
{
  "zSafe": 0,
  "zSpinOff": 23,
  "zRetreat": 10,
  "unloadRpm": 1500,
  "loadRpm": 1200,
  "engageFeedrate": 3500,
  "zProbeStart": -10
}
```

## Usage

1. Open the Manual Tool Changer dialog from the Tools menu
2. Configure the **Tool Setter** location using the "Grab" button
3. Configure the **Manual Tool Change** location using the "Grab" button
4. Optionally enable **RapidChangeSolo** and configure pocket location
5. Set the number of tools in your library
6. Save configuration

### G-code Commands

```gcode
; Tool change
M6 T1

; Manual tool length measurement
$TLS

; Move to pocket (RapidChangeSolo)
$POCKET1

; Home with automatic TLS (if enabled)
$H
```

## Development

This plugin is part of the ncSender ecosystem: https://github.com/siganberg/ncSender

## License

This plugin is available under a **dual license** (GPL-3.0 + Commercial).

See the [LICENSE](LICENSE) file for details, or contact support@franciscreation.com for commercial licensing.

Copyright (C) 2024 Francis Marasigan
