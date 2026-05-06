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
