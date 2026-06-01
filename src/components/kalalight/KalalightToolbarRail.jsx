function FullscreenIcon({ isFullscreen }) {
  if (isFullscreen) {
    return (
      <svg aria-hidden="true" className="kalalight-rail-icon" viewBox="0 0 24 24">
        <path d="M9 3v6H3" />
        <path d="M15 3v6h6" />
        <path d="M9 21v-6H3" />
        <path d="M15 21v-6h6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="kalalight-rail-icon" viewBox="0 0 24 24">
      <path d="M8 3H3v5" />
      <path d="M16 3h5v5" />
      <path d="M8 21H3v-5" />
      <path d="M16 21h5v-5" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg aria-hidden="true" className="kalalight-rail-icon" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
    </svg>
  );
}

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
        className={chimeEnabled ? "kalalight-icon-music" : "kalalight-icon-music muted"}
        aria-label={chimeEnabled ? "Mute chime" : "Enable chime"}
        title={chimeEnabled ? "Mute chime" : "Enable chime"}
        onClick={onToggleChime}
      />
      <button
        type="button"
        className="kalalight-icon-projector"
        aria-label="Open projector display"
        title="Open projector display"
        onClick={onOpenProjector}
      />
      <button
        type="button"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        onClick={onToggleFullscreen}
      >
        <FullscreenIcon isFullscreen={isFullscreen} />
      </button>
      <button type="button" aria-label="Reset timer" title="Reset timer" onClick={onReset}>
        <ResetIcon />
      </button>
    </div>
  );
}
