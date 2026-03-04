# Heater Controls Implementation Plan

## Overview
Add basic control functions to turn heater on/off and change gear/level before deploying to production. Focus on sending commands with simple response feedback.

## Command Endpoint
- **URL**: `https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF/commands/send_new`
- **Method**: POST
- **Auth**: Requires access token (Bearer token)

## Command Structure

### Power Control
```json
{
  "command": {
    "device_uid": "345F4537C1B0",
    "command_type": "POWER",
    "command_value": 0,  // 0 = off, 1 = on (assumed)
    "origin": "REMOTE"
  }
}
```

### Gear/Level Control (assumed structure)
```json
{
  "command": {
    "device_uid": "345F4537C1B0",
    "command_type": "GEAR" or "LEVEL",  // Need to confirm
    "command_value": 1-5,  // Assuming 1-5 levels
    "origin": "REMOTE"
  }
}
```

## Questions to Resolve

1. **Device UID**: 
   - Is this hardcoded or dynamic?
   - Do you have multiple heaters?
   - Should we store it in config/env?

2. **Power Values**:
   - `0` = Off (confirmed)
   - `1` = On (assumed - need confirmation)

3. **Gear/Level**:
   - What are the valid values? (1-5? 1-10?)
   - What is the exact `command_type`? ("GEAR", "LEVEL", "SPEED"?)
   - What does each level represent?

4. **Response Format**:
   - What does the endpoint return on success?
   - What does it return on error?
   - Should we show success/error messages?

## Implementation Plan

### Phase 1: API Service Layer
**File**: `src/services/heaterService.js`

**Functions Needed**:
1. `sendPowerCommand(deviceUid, powerState)` 
   - `powerState`: 0 (off) or 1 (on)
   - Returns: API response

2. `sendGearCommand(deviceUid, gearLevel)`
   - `gearLevel`: 1-5 (or whatever range)
   - Returns: API response

3. `sendCommand(deviceUid, commandType, commandValue)`
   - Generic command sender
   - Used by above functions

**Implementation Details**:
- Use authenticated `api` service (not publicApi)
- Handle errors gracefully
- Return success/error status
- Show loading states

### Phase 2: UI Components

#### Option A: Simple Button Layout (Recommended for MVP)
```
┌─────────────────────────────────┐
│     Heater Control              │
├─────────────────────────────────┤
│  [Power On]  [Power Off]        │
│                                 │
│  Gear/Level:                    │
│  [1] [2] [3] [4] [5]           │
│                                 │
│  Status: Ready                  │
└─────────────────────────────────┘
```

#### Option B: Toggle Switch + Gear Selector
```
┌─────────────────────────────────┐
│     Heater Control              │
├─────────────────────────────────┤
│  Power: [Toggle Switch]          │
│                                 │
│  Level: [Slider or Buttons]     │
│        1 ───●─── 5              │
│                                 │
│  [Send Command]                 │
└─────────────────────────────────┘
```

### Phase 3: Component Structure

**File**: `src/components/HeaterControl/HeaterControl.jsx`

**Sub-components**:
1. `PowerToggle.jsx` - On/Off buttons
2. `GearSelector.jsx` - Level selection (buttons or slider)
3. `CommandStatus.jsx` - Success/error feedback

**State Management**:
- Current power state (local state, not from API yet)
- Current gear level (local state)
- Loading state (sending command)
- Success/error message

### Phase 4: User Experience Flow

1. **User clicks "Power On"**:
   - Button shows loading state
   - Send command: `{ command_type: "POWER", command_value: 1 }`
   - Show success message: "Heater turned on"
   - Update local state

2. **User clicks "Power Off"**:
   - Button shows loading state
   - Send command: `{ command_type: "POWER", command_value: 0 }`
   - Show success message: "Heater turned off"
   - Update local state

3. **User selects gear level**:
   - Click gear button (e.g., "3")
   - Button shows loading state
   - Send command: `{ command_type: "GEAR", command_value: 3 }`
   - Show success message: "Gear set to level 3"
   - Update local state

### Phase 5: Error Handling

**Scenarios**:
- Network error → Show "Failed to send command. Please try again."
- 401 Unauthorized → Auto-refresh token, retry
- 400 Bad Request → Show error message from API
- Device not found → Show "Device not available"

**UI Feedback**:
- Success: Green toast/alert (3 seconds)
- Error: Red toast/alert (5 seconds)
- Loading: Disable buttons, show spinner

## File Structure

```
src/
├── services/
│   └── heaterService.js          # NEW - Command sending logic
├── components/
│   └── HeaterControl/
│       ├── HeaterControl.jsx     # UPDATE - Main component
│       ├── PowerToggle.jsx       # NEW - On/Off buttons
│       ├── GearSelector.jsx      # NEW - Level selection
│       └── CommandStatus.jsx     # NEW - Feedback messages
```

## Implementation Steps

### Step 1: Create Heater Service
- Create `heaterService.js`
- Implement `sendCommand()` function
- Implement `sendPowerCommand()` and `sendGearCommand()` wrappers
- Add error handling

### Step 2: Update HeaterControl Component
- Replace placeholder with actual controls
- Add state management (power, gear, loading, message)
- Import and use `heaterService`

### Step 3: Create Power Toggle Component
- Two buttons: "Turn On" and "Turn Off"
- Loading states
- Disabled states when loading
- Visual feedback (active state)

### Step 4: Create Gear Selector Component
- Buttons for each gear level (1-5 or range)
- Active state highlighting
- Loading states
- Or use Chakra UI Slider component

### Step 5: Add Status Feedback
- Toast notifications (Chakra UI Toast)
- Or inline status message
- Success/error styling

### Step 6: Handle Read-Only Mode
- Disable all controls when `readOnly={true}`
- Show "Controls disabled in public view" message

## Configuration

### Device UID Storage Options:

**Option 1: Environment Variable** (Recommended)
```env
VITE_HEATER_DEVICE_UID=345F4537C1B0
```

**Option 2: Hardcoded Constant**
```javascript
const DEFAULT_DEVICE_UID = "345F4537C1B0"
```

**Option 3: User Settings** (Future)
- Store in user profile
- Allow multiple devices
- Device selector dropdown

**Recommendation**: Start with Option 1 (env variable) for flexibility.

## UI Design Considerations

### Mobile-First
- Large touch targets (min 44x44px)
- Clear visual feedback
- Easy to use with one hand

### Visual States
- **Idle**: Default button style
- **Active**: Highlighted (current state)
- **Loading**: Spinner + disabled
- **Success**: Green highlight briefly
- **Error**: Red highlight + message

### Chakra UI Components to Use
- `Button` - For power and gear controls
- `ButtonGroup` - For gear level buttons
- `Toast` - For success/error messages
- `Spinner` - For loading states
- `Alert` - For error messages (optional)

## Testing Checklist

- [ ] Power On command sends correctly
- [ ] Power Off command sends correctly
- [ ] Gear commands send correctly
- [ ] Loading states work
- [ ] Success messages display
- [ ] Error messages display
- [ ] Buttons disabled during loading
- [ ] Read-only mode disables controls
- [ ] Mobile responsive
- [ ] Works with expired token (auto-refresh)

## Future Enhancements (Post-MVP)

1. **Status Feedback**:
   - Poll for heater status
   - Show current power state from device
   - Show current gear level from device

2. **Command History**:
   - Log recent commands
   - Show command timestamps

3. **Multiple Devices**:
   - Device selector
   - Control multiple heaters

4. **Scheduled Commands**:
   - Set timers
   - Schedule on/off times

5. **Advanced Controls**:
   - Temperature setpoints
   - Fan speed
   - Mode selection

## Estimated Time

- **Heater Service**: 30 minutes
- **Power Toggle Component**: 30 minutes
- **Gear Selector Component**: 30 minutes
- **Status Feedback**: 20 minutes
- **Integration & Testing**: 30 minutes

**Total**: ~2.5 hours

## Next Steps

1. **Confirm Command Details**:
   - Power on value (1?)
   - Gear command type ("GEAR"?)
   - Valid gear range (1-5?)
   - Device UID source (env variable?)

2. **Start Implementation**:
   - Create heater service
   - Build UI components
   - Integrate and test

3. **Test Before Deploy**:
   - Test all commands
   - Verify error handling
   - Test on mobile device

---

Ready to proceed once you confirm the command details!
