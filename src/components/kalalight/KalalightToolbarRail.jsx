export function KalalightToolbarRail({
  visible,
  chimeEnabled,
  isFullscreen,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onSubtractMinute,
  onAddMinute,
  onToggleChime,
  onOpenProjector,
  onToggleFullscreen,
  onReset,
}) {
  return (
    <div
      className={`kalalight-toolbar-rail ${visible ? "visible" : ""}`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <button type="button" aria-label="Subtract one minute" title="Subtract one minute" onClick={onSubtractMinute}>
        -1
      </button>
      <button type="button" aria-label="Add one minute" title="Add one minute" onClick={onAddMinute}>
        +1
      </button>
      <button
        type="button"
        aria-label={chimeEnabled ? "Turn chime off" : "Turn chime on"}
        title={chimeEnabled ? "Turn chime off" : "Turn chime on"}
        onClick={onToggleChime}
      >
        {chimeEnabled ? "Vol" : "Mute"}
      </button>
      <button type="button" aria-label="Open projector display" title="Open projector display" onClick={onOpenProjector}>
        Project
      </button>
      <button
        type="button"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        onClick={onToggleFullscreen}
      >
        {isFullscreen ? "Min" : "Full"}
      </button>
      <button type="button" aria-label="Reset timer" title="Reset timer" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}
