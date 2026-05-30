import { promises as fs } from "fs";
import path from "path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TEMPLATE_REGISTRY = {
  "createaccounts/admin": {
    folder: "createaccounts",
    downloadName: "createadmin.xlsx",
    candidates: ["createadmin.xlsx", "admin.xlsx"],
  },
  "createaccounts/academic": {
    folder: "createaccounts",
    downloadName: "createacademic.xlsx",
    candidates: [
      "createacademic.xlsx",
      "createcbdt.xlsx",
      "academic.xlsx",
      "cbdt.xlsx",
    ],
  },
  "createaccounts/lecturer": {
    folder: "createaccounts",
    downloadName: "createlecturer.xlsx",
    candidates: ["createlecturer.xlsx", "lecturer.xlsx"],
  },
  "createaccounts/student": {
    folder: "createaccounts",
    downloadName: "createstudent.xlsx",
    candidates: ["createstudent.xlsx", "student.xlsx"],
  },
  "createaccounts/technician": {
    folder: "createaccounts",
    downloadName: "createtechnician.xlsx",
    candidates: ["createtechnician.xlsx", "technician.xlsx"],
  },

  "createlab/rooms": {
    folder: "createlab",
    downloadName: "rooms.xlsx",
    candidates: ["rooms.xlsx", "createrooms.xlsx", "create_rooms.xlsx"],
  },
  "createlab/devices": {
    folder: "createlab",
    downloadName: "devices.xlsx",
    candidates: ["devices.xlsx", "createdevices.xlsx", "create_devices.xlsx"],
  },
  "createlab/softwares": {
    folder: "createlab",
    downloadName: "softwares.xlsx",
    candidates: [
      "softwares.xlsx",
      "software.xlsx",
      "createsoftwares.xlsx",
      "create_softwares.xlsx",
      "create_software.xlsx",
    ],
  },

  "createcourse/semesters": {
    folder: "createcourse",
    downloadName: "semesters.xlsx",
    candidates: [
      "semesters.xlsx",
      "semester.xlsx",
      "create_semesters.xlsx",
      "createsemesters.xlsx",
    ],
  },
  "createcourse/academic-weeks": {
    folder: "createcourse",
    downloadName: "academic_weeks.xlsx",
    candidates: [
      "academic_weeks.xlsx",
      "academic-weeks.xlsx",
      "academic_week.xlsx",
      "academic-week.xlsx",
      "weeks.xlsx",
      "week.xlsx",
      "create_academic_weeks.xlsx",
      "createacademicweeks.xlsx",
    ],
  },
  "createcourse/weeks": {
    folder: "createcourse",
    downloadName: "academic_weeks.xlsx",
    candidates: [
      "academic_weeks.xlsx",
      "academic-weeks.xlsx",
      "academic_week.xlsx",
      "academic-week.xlsx",
      "weeks.xlsx",
      "week.xlsx",
      "create_academic_weeks.xlsx",
      "createacademicweeks.xlsx",
    ],
  },
  "createcourse/time-slots": {
    folder: "createcourse",
    downloadName: "time_slots.xlsx",
    candidates: [
      "time_slots.xlsx",
      "time-slots.xlsx",
      "timeslots.xlsx",
      "slots.xlsx",
      "slot.xlsx",
      "create_time_slots.xlsx",
      "createtimeslots.xlsx",
    ],
  },
  "createcourse/courses": {
    folder: "createcourse",
    downloadName: "courses.xlsx",
    candidates: [
      "courses.xlsx",
      "course.xlsx",
      "create_courses.xlsx",
      "createcourses.xlsx",
    ],
  },
  "createcourse/course-sections": {
    folder: "createcourse",
    downloadName: "course_sections.xlsx",
    candidates: [
      "course_sections.xlsx",
      "course-sections.xlsx",
      "coursesections.xlsx",
      "sections.xlsx",
      "section.xlsx",
      "create_course_sections.xlsx",
      "createcoursesections.xlsx",
    ],
  },
};

function buildNotFoundResponse(templateKey, checkedFiles = []) {
  return NextResponse.json(
    {
      success: false,
      message: "Không tìm thấy biểu mẫu.",
      data: {
        template_key: templateKey,
        checked_files: checkedFiles,
      },
    },
    { status: 404 },
  );
}

function buildSafeAttachmentName(fileName) {
  return String(fileName || "template.xlsx").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(_request, context) {
  const params = await context.params;
  const templatePath = Array.isArray(params?.templatePath)
    ? params.templatePath
    : [];

  const templateKey = templatePath.join("/");
  const templateConfig = TEMPLATE_REGISTRY[templateKey];

  if (!templateConfig) {
    return buildNotFoundResponse(templateKey);
  }

  const docsFormRoot = path.resolve(process.cwd(), "..", "docs", "form");
  const safeRootPrefix = `${docsFormRoot}${path.sep}`;
  const checkedFiles = [];

  for (const candidate of templateConfig.candidates) {
    const absoluteFilePath = path.resolve(
      docsFormRoot,
      templateConfig.folder,
      candidate,
    );

    if (!absoluteFilePath.startsWith(safeRootPrefix)) {
      continue;
    }

    checkedFiles.push(path.relative(docsFormRoot, absoluteFilePath));

    try {
      const fileBuffer = await fs.readFile(absoluteFilePath);
      const downloadName = buildSafeAttachmentName(templateConfig.downloadName);

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${downloadName}"`,
          "Content-Length": String(fileBuffer.byteLength),
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      if (error?.code !== "ENOENT") {
        return NextResponse.json(
          {
            success: false,
            message: "Không đọc được biểu mẫu.",
            data: {
              template_key: templateKey,
              file: path.relative(docsFormRoot, absoluteFilePath),
            },
          },
          { status: 500 },
        );
      }
    }
  }

  return buildNotFoundResponse(templateKey, checkedFiles);
}
