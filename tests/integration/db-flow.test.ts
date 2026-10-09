import { describe, it, expect } from "vitest";
import { signupUser, authenticateUser } from "@/server/services/auth.service";
import { createClass, joinClass, listClassesForTeacher, listClassesForStudent } from "@/server/services/classes.service";

describe("PostgreSQL Integration: Auth & Class Membership Flow", () => {
  const uniquePrefix = `test_${Date.now()}`;
  const teacherEmail = `${uniquePrefix}_guru@sekolah.id`;
  const studentEmail = `${uniquePrefix}_siswa@sekolah.id`;
  const password = "PasswordKuatSangatPanjang123";

  let teacherId: string;
  let studentId: string;
  let createdClassId: string;
  let joinCode: string;

  const ip1 = `10.20.1.${Math.floor(Math.random() * 250) + 1}`;
  const ip2 = `10.20.2.${Math.floor(Math.random() * 250) + 1}`;

  it("registers teacher and student into PostgreSQL", async () => {
    const teacher = await signupUser(
      {
        displayName: "Ibu Guru Test",
        email: teacherEmail,
        password,
        role: "teacher",
      },
      ip1,
    );
    teacherId = teacher.id;
    expect(teacher.role).toBe("teacher");

    const student = await signupUser(
      {
        displayName: "Siswa Test",
        email: studentEmail,
        password,
        role: "student",
      },
      ip2,
    );
    studentId = student.id;
    expect(student.role).toBe("student");
  });

  it("authenticates users with correct credentials", async () => {
    const auth = await authenticateUser(
      { email: teacherEmail, password },
      "127.0.0.1",
    );
    expect(auth.id).toBe(teacherId);
    expect(auth.role).toBe("teacher");
  });

  it("teacher creates a class with auto-generated unique Crockford join code", async () => {
    const teacherSessionUser = {
      id: teacherId,
      email: teacherEmail,
      displayName: "Ibu Guru Test",
      role: "teacher" as const,
    };

    const res = await createClass(teacherSessionUser, {
      name: "Kelas IPA Integrasi Test",
      description: "Deskripsi integrasi",
    });
    createdClassId = res.id;
    expect(createdClassId).toBeDefined();

    const teacherClasses = await listClassesForTeacher(teacherId);
    const found = teacherClasses.find((c) => c.id === createdClassId);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Kelas IPA Integrasi Test");
    expect(found?.joinCode).toHaveLength(12);
    joinCode = found!.joinCode;
  });

  it("student joins class via join code idempotently", async () => {
    const studentSessionUser = {
      id: studentId,
      email: studentEmail,
      displayName: "Siswa Test",
      role: "student" as const,
    };

    // First join
    const joined = await joinClass(studentSessionUser, { code: joinCode });
    expect(joined.id).toBe(createdClassId);

    // Second join (idempotent, no duplicate error)
    const joinedAgain = await joinClass(studentSessionUser, { code: joinCode });
    expect(joinedAgain.id).toBe(createdClassId);

    // Verify student sees this class
    const studentClasses = await listClassesForStudent(studentId);
    expect(studentClasses.some((c) => c.id === createdClassId)).toBe(true);
  });
});
