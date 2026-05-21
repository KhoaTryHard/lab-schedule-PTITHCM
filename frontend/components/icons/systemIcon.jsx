/**
 * Icon nhóm người dùng.
 * Có thể đổi màu bằng CSS thông qua currentColor.
 */
export function UsersIcon({ className = "", size = 24 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M16 11C17.6569 11 19 9.65685 19 8C19 6.34315 17.6569 5 16 5C14.3431 5 13 6.34315 13 8C13 9.65685 14.3431 11 16 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M8 11C9.65685 11 11 9.65685 11 8C11 6.34315 9.65685 5 8 5C6.34315 5 5 6.34315 5 8C5 9.65685 6.34315 11 8 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M3 19C3 16.7909 4.79086 15 7 15H9C11.2091 15 13 16.7909 13 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M11 19C11 16.7909 12.7909 15 15 15H17C19.2091 15 21 16.7909 21 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AdminIcon({ className = "", size = 24 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 3L19 6V11C19 16 15.5 20.5 12 21C8.5 20.5 5 16 5 11V6L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <path
        d="M9.5 12L11 13.5L14.5 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AcademicIcon({ className = "", size = 24 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 4L3 9L12 14L21 9L12 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <path
        d="M7 11.5V16C7 17.6569 9.23858 19 12 19C14.7614 19 17 17.6569 17 16V11.5"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function TechnicianIcon({ className = "", size = 24 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path d="M14 7L17 10" stroke="currentColor" strokeWidth="2" />

      <path
        d="M3 21L10 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M14.5 3C16.9853 3 19 5.01472 19 7.5C19 8.37873 18.748 9.1986 18.3125 9.89062L10 18.2031L5.79688 14L14.1094 5.6875C14.8014 5.25205 15.6213 5 16.5 5"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function LecturerIcon({ className = "", size = 24 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M8 21H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path d="M12 17V21" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function StudentIcon({ className = "", size = 24 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />

      <path
        d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildStrokeIconProps({
  className = "",
  size,
  strokeWidth = "1.9",
  withSize = true,
}) {
  return {
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    ...(withSize ? { width: size, height: size } : {}),
    ...(className ? { className } : {}),
    "aria-hidden": "true",
  };
}

export function renderSidebarIcon(iconName) {
  const commonProps = buildStrokeIconProps({ withSize: false });

  switch (iconName) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
          <rect x="13.5" y="11" width="7" height="9.5" rx="1.5" />
          <rect x="3.5" y="13" width="7" height="7.5" rx="1.5" />
        </svg>
      );
    case "person":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5 19.25c0-3.15 3.1-5 7-5s7 1.85 7 5" />
        </svg>
      );
    case "equipment":
      return (
        <svg {...commonProps}>
          <path d="M4 20.5h9" />
          <path d="M8 20.5V11" />
          <path d="M8 11 5.5 6.5l2.5-1.5L10.5 9 13 7.5" />
          <path d="m13 7.5 2-2 3.5 3.5-2 2" />
          <path d="M14.5 12.5 20 18" />
        </svg>
      );
    case "school":
      return (
        <svg {...commonProps}>
          <path d="m3 9 9-5 9 5-9 5-9-5Z" />
          <path d="M7 11.25v4.5c0 1.2 2.25 2.75 5 2.75s5-1.55 5-2.75v-4.5" />
        </svg>
      );
    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="6.25" />
          <path d="m16 16 4.25 4.25" />
        </svg>
      );
    case "chart":
      return (
        <svg {...commonProps}>
          <path d="M4 20.5h16" />
          <path d="M7 20.5v-8" />
          <path d="M12 20.5V6.5" />
          <path d="M17 20.5v-11" />
        </svg>
      );
    case "settings":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3.25" />
          <path d="M19.1 15a1 1 0 0 0 .2 1.1l.05.05a2 2 0 0 1 0 2.8 2 2 0 0 1-2.8 0l-.05-.05a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.1a1 1 0 0 0-.65-.95 1 1 0 0 0-1.1.2l-.05.05a2 2 0 1 1-2.8-2.8l.05-.05a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.1a1 1 0 0 0 .95-.65 1 1 0 0 0-.2-1.1L4.8 8.2a2 2 0 1 1 2.8-2.8l.05.05a1 1 0 0 0 1.1.2H8.8a1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.1a1 1 0 0 0 .65.95 1 1 0 0 0 1.1-.2l.05-.05a2 2 0 0 1 2.8 2.8l-.05.05a1 1 0 0 0-.2 1.1v.05a1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.1a1 1 0 0 0-.8.65Z" />
        </svg>
      );
    default:
      return null;
  }
}

export function renderLineIcon(iconName) {
  const commonProps = {
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
  };

  switch (iconName) {
    case "menu":
      return (
        <svg {...commonProps}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "shield":
      return (
        <svg {...commonProps}>
          <path d="M12 3l7 3v5c0 4.5-2.8 8.4-7 10-4.2-1.6-7-5.5-7-10V6l7-3z" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...commonProps}>
          <path d="M9 4h6l1 2h3v14H5V6h3l1-2zM9 10h6M9 14h6" />
        </svg>
      );
    case "teacher":
      return (
        <svg {...commonProps}>
          <path d="M4 6h16v8H4zM8 18h8M12 14v4M8 10h8" />
        </svg>
      );
    case "monitor":
      return (
        <svg {...commonProps}>
          <path d="M4 5h16v10H4zM9 19h6M12 15v4" />
        </svg>
      );
    case "student":
      return (
        <svg {...commonProps}>
          <path d="M3 9l9-4 9 4-9 4-9-4zM7 11v4c0 1.8 2.2 3 5 3s5-1.2 5-3v-4" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...commonProps}>
          <path d="M7 3v3M17 3v3M4 8h16M5 5h14v15H5zM8 12h3M13 12h3M8 16h3" />
        </svg>
      );
    case "warning":
      return (
        <svg {...commonProps}>
          <path d="M12 4l8 14H4L12 4zM12 10v4M12 17h.01" />
        </svg>
      );
    case "laptop":
      return (
        <svg {...commonProps}>
          <path d="M5 6h14v9H5zM3 18h18" />
        </svg>
      );
    case "settings":
      return (
        <svg {...commonProps}>
          <path d="M12 8.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5zM19 12l2-1-1-3-2 .2-.9-1.6 1.2-1.7-2.2-2.2-1.7 1.2L13 3l-1-2h-3l-1 2-1.6.9-1.7-1.2L2.5 5l1.2 1.7L2.8 8.3 1 8l-1 3 2 1v2l-2 1 1 3 1.8-.3 1 1.6-1.2 1.7L5 23.5l1.7-1.2 1.6.9 1 1.8h3l1-1.8 1.6-.9 1.7 1.2 2.2-2.2-1.2-1.7.9-1.6 2 .3 1-3-2-1z" />
        </svg>
      );
    case "approve":
      return (
        <svg {...commonProps}>
          <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9zM8 12l2.5 2.5L16 9" />
        </svg>
      );
    case "bell":
      return (
        <svg {...commonProps}>
          <path d="M6 16h12l-1.5-2v-3a4.5 4.5 0 0 0-9 0v3L6 16zM10 18a2 2 0 0 0 4 0" />
        </svg>
      );
    case "alert":
      return (
        <svg {...commonProps}>
          <path d="M12 3l9 16H3L12 3zM12 9v4M12 16h.01" />
        </svg>
      );
    case "search":
      return (
        <svg {...commonProps}>
          <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />
        </svg>
      );
    case "spark":
      return (
        <svg {...commonProps}>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
        </svg>
      );
    case "layers":
      return (
        <svg {...commonProps}>
          <path d="M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...commonProps}>
          <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9zM12 7v5l3 2" />
        </svg>
      );
    case "arrowRight":
      return (
        <svg {...commonProps}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
  }
}

export function renderRoomIcon(iconName, className = "", size = 24) {
  const commonProps = buildStrokeIconProps({ className, size });

  switch (iconName) {
    case "room":
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 4v16" />
          <path d="M15 10h.01" />
        </svg>
      );
    case "available":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="m8.5 12 2.2 2.2 4.8-4.8" />
        </svg>
      );
    case "maintenance":
      return (
        <svg {...commonProps}>
          <path d="M14.5 4.5a4 4 0 0 0 4.7 4.7L11 17.4 6.6 13l7.9-7.9Z" />
          <path d="M4.5 19.5 6.6 17.4" />
        </svg>
      );
    case "computer":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );
    case "usable":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="m10 11 2 2 4-4" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );
    case "alert":
      return (
        <svg {...commonProps}>
          <path d="M12 4 3.5 19h17L12 4Z" />
          <path d="M12 9v4" />
          <path d="M12 16h.01" />
        </svg>
      );
    case "device":
      return (
        <svg {...commonProps}>
          <path d="M14 7 17 10" />
          <path d="M3 21 10 14" />
          <path d="M14.5 3C16.9853 3 19 5.01472 19 7.5c0 .87873-.252 1.6986-.6875 2.39062L10 18.2031 5.79688 14l8.31252-8.3125C14.8014 5.25205 15.6213 5 16.5 5" />
        </svg>
      );
    case "software":
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 9h8" />
          <path d="M8 12h8" />
          <path d="M8 15h5" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export function renderTrainingIcon(iconName, className = "", size = 24) {
  const commonProps = buildStrokeIconProps({ className, size });

  switch (iconName) {
    case "overview":
      return (
        <svg {...commonProps}>
          <path d="M4 19h16" />
          <path d="M6 16V9" />
          <path d="M12 16V5" />
          <path d="M18 16v-3" />
        </svg>
      );
    case "semester":
      return (
        <svg {...commonProps}>
          <rect x="4" y="5" width="16" height="15" rx="3" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 10h16" />
        </svg>
      );
    case "week":
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 8h8" />
          <path d="M8 12h4" />
          <path d="M8 16h6" />
        </svg>
      );
    case "slot":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
    case "course":
      return (
        <svg {...commonProps}>
          <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H19v14H7.5A2.5 2.5 0 0 0 5 20.5Z" />
          <path d="M5 6.5v14" />
        </svg>
      );
    case "section":
      return (
        <svg {...commonProps}>
          <rect x="4" y="5" width="16" height="4" rx="1.5" />
          <rect x="4" y="10" width="16" height="4" rx="1.5" />
          <rect x="4" y="15" width="10" height="4" rx="1.5" />
        </svg>
      );
    case "cohort":
      return (
        <svg {...commonProps}>
          <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M16 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path d="M4 19c0-2.5 2-4 4.5-4H10c2.5 0 4.5 1.5 4.5 4" />
          <path d="M14 19c.2-1.7 1.5-3 3.5-3H18c1 0 1.9.3 2.6.9" />
        </svg>
      );
    case "lecturer":
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="12" rx="2" />
          <path d="M8 20h8" />
          <path d="M12 16v4" />
          <path d="m9 9 2 2 4-4" />
        </svg>
      );
    case "import":
      return (
        <svg {...commonProps}>
          <path d="M12 4v10" />
          <path d="m8.5 8.5 3.5-3.5 3.5 3.5" />
          <path d="M5 19h14" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export function renderReportIcon(iconName, className = "", size = 24) {
  const commonProps = buildStrokeIconProps({ className, size });

  switch (iconName) {
    case "schedule":
      return (
        <svg {...commonProps}>
          <rect x="4" y="5" width="16" height="15" rx="3" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 10h16" />
        </svg>
      );
    case "published":
      return (
        <svg {...commonProps}>
          <path d="M12 4 3.5 8l8.5 4 8.5-4L12 4Z" />
          <path d="m3.5 12 8.5 4 8.5-4" />
          <path d="m3.5 16 8.5 4 8.5-4" />
        </svg>
      );
    case "approved":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="m8.5 12 2.2 2.2 4.8-4.8" />
        </svg>
      );
    case "cancelled":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="m9 9 6 6" />
          <path d="m15 9-6 6" />
        </svg>
      );
    case "usage":
      return (
        <svg {...commonProps}>
          <path d="M4 19h16" />
          <path d="M6 16V9" />
          <path d="M12 16V5" />
          <path d="M18 16v-3" />
        </svg>
      );
    case "issue":
      return (
        <svg {...commonProps}>
          <path d="M12 4 3.5 19h17L12 4Z" />
          <path d="M12 9v4" />
          <path d="M12 16h.01" />
        </svg>
      );
    case "device":
      return (
        <svg {...commonProps}>
          <path d="M14 7 17 10" />
          <path d="M3 21 10 14" />
          <path d="M14.5 3C16.9853 3 19 5.01472 19 7.5c0 .87873-.252 1.6986-.6875 2.39062L10 18.2031 5.79688 14l8.31252-8.3125C14.8014 5.25205 15.6213 5 16.5 5" />
        </svg>
      );
    case "software":
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 9h8" />
          <path d="M8 12h8" />
          <path d="M8 15h5" />
        </svg>
      );
    case "room":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );
    case "change":
      return (
        <svg {...commonProps}>
          <path d="M7 7h9a4 4 0 0 1 4 4v0" />
          <path d="m13 3 3 4-3 4" />
          <path d="M17 17H8a4 4 0 0 1-4-4v0" />
          <path d="m11 21-3-4 3-4" />
        </svg>
      );
    case "template":
      return (
        <svg {...commonProps}>
          <path d="M8 4h8l4 4v12H8Z" />
          <path d="M16 4v4h4" />
          <path d="M11 13h6" />
          <path d="M11 17h6" />
        </svg>
      );
    case "download":
      return (
        <svg {...commonProps}>
          <path d="M12 4v10" />
          <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
          <path d="M5 19h14" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
