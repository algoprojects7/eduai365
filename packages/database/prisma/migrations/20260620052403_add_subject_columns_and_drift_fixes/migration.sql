-- DropIndex
DROP INDEX "subjects_schoolId_code_key";

-- AlterTable
ALTER TABLE "admission_applications" ADD COLUMN     "address" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "parentWhatsapp" TEXT;

-- AlterTable
ALTER TABLE "bookstore_items" ADD COLUMN     "rackNo" TEXT;

-- AlterTable
ALTER TABLE "employee_profiles" ADD COLUMN     "dateOfBirth" DATE;

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "className" TEXT,
ADD COLUMN     "maxMarks" INTEGER NOT NULL DEFAULT 100;

-- CreateIndex
CREATE INDEX "subjects_schoolId_className_academicYear_idx" ON "subjects"("schoolId", "className", "academicYear");
