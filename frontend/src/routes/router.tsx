import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { RequireRole } from "./RequireRole";
import { HomeScreen } from "../screens/Home/HomeScreen";
import { PeriodListScreen } from "../screens/Tests/PeriodListScreen";
import { TestListScreen } from "../screens/Tests/TestListScreen";
import { TestTakingScreen } from "../screens/Tests/TestTakingScreen";
import { TestResultScreen } from "../screens/Tests/TestResultScreen";
import { AttendanceScreen } from "../screens/Attendance/AttendanceScreen";
import { ExamListScreen } from "../screens/Exams/ExamListScreen";
import { ExamTakingScreen } from "../screens/Exams/ExamTakingScreen";
import { ExamResultScreen } from "../screens/Exams/ExamResultScreen";
import { DashboardScreen } from "../screens/Dashboard/DashboardScreen";
import { ReviewScreen } from "../screens/Review/ReviewScreen";
import { LeaderboardScreen } from "../screens/Leaderboard/LeaderboardScreen";
import { AdminHomeScreen } from "../screens/Admin/AdminHomeScreen";
import { AdminTestsListScreen } from "../screens/Admin/Tests/AdminTestsListScreen";
import { AdminTestEditScreen } from "../screens/Admin/Tests/AdminTestEditScreen";
import { AdminAttendanceScreen } from "../screens/Admin/Attendance/AdminAttendanceScreen";
import { AdminSessionDetailScreen } from "../screens/Admin/Attendance/AdminSessionDetailScreen";
import { AdminExamsListScreen } from "../screens/Admin/Exams/AdminExamsListScreen";
import { AdminExamEditScreen } from "../screens/Admin/Exams/AdminExamEditScreen";
import { AdminStudentsListScreen } from "../screens/Admin/Students/AdminStudentsListScreen";
import { AdminStudentDetailScreen } from "../screens/Admin/Students/AdminStudentDetailScreen";
import { MaterialCategoryScreen } from "../screens/Materials/MaterialCategoryScreen";
import { MaterialListScreen } from "../screens/Materials/MaterialListScreen";
import { MaterialDetailScreen } from "../screens/Materials/MaterialDetailScreen";
import { AdminMaterialsListScreen } from "../screens/Admin/Materials/AdminMaterialsListScreen";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomeScreen /> },

      { path: "/tests", element: <PeriodListScreen /> },
      { path: "/tests/:period", element: <TestListScreen /> },
      { path: "/tests/:period/:subCategory", element: <TestListScreen /> },
      { path: "/tests/:testId/take", element: <TestTakingScreen /> },
      { path: "/tests/:testId/result/:resultId", element: <TestResultScreen /> },
      { path: "/tests/:testId/result/:resultId/review", element: <ReviewScreen kind="test" /> },

      { path: "/attendance", element: <AttendanceScreen /> },

      { path: "/materials/:category", element: <MaterialCategoryScreen /> },
      { path: "/materials/section/:section", element: <MaterialListScreen /> },
      { path: "/materials/item/:id", element: <MaterialDetailScreen /> },

      { path: "/exams", element: <ExamListScreen /> },
      { path: "/exams/:examId/take", element: <ExamTakingScreen /> },
      { path: "/exams/:examId/result/:resultId", element: <ExamResultScreen /> },
      { path: "/exams/:examId/result/:resultId/review", element: <ReviewScreen kind="exam" /> },

      {
        path: "/leaderboard",
        element: (
          <RequireRole role={["student", "admin"]}>
            <LeaderboardScreen />
          </RequireRole>
        ),
      },

      {
        path: "/dashboard",
        element: (
          <RequireRole role="student">
            <DashboardScreen />
          </RequireRole>
        ),
      },

      {
        path: "/admin",
        element: (
          <RequireRole role="admin">
            <AdminHomeScreen />
          </RequireRole>
        ),
      },
      {
        path: "/admin/tests",
        element: (
          <RequireRole role="admin">
            <AdminTestsListScreen />
          </RequireRole>
        ),
      },
      {
        path: "/admin/tests/:testId/edit",
        element: (
          <RequireRole role="admin">
            <AdminTestEditScreen />
          </RequireRole>
        ),
      },
      {
        path: "/admin/attendance",
        element: (
          <RequireRole role="admin">
            <AdminAttendanceScreen />
          </RequireRole>
        ),
      },
      {
        path: "/admin/attendance/:sessionId",
        element: (
          <RequireRole role="admin">
            <AdminSessionDetailScreen />
          </RequireRole>
        ),
      },
      {
        path: "/admin/exams",
        element: (
          <RequireRole role="admin">
            <AdminExamsListScreen />
          </RequireRole>
        ),
      },
      {
        path: "/admin/exams/:examId/edit",
        element: (
          <RequireRole role="admin">
            <AdminExamEditScreen />
          </RequireRole>
        ),
      },
      {
        path: "/admin/students",
        element: (
          <RequireRole role="admin">
            <AdminStudentsListScreen />
          </RequireRole>
        ),
      },
      {
        path: "/admin/students/:studentId",
        element: (
          <RequireRole role="admin">
            <AdminStudentDetailScreen />
          </RequireRole>
        ),
      },
      {
        path: "/admin/materials",
        element: (
          <RequireRole role="admin">
            <AdminMaterialsListScreen />
          </RequireRole>
        ),
      },
    ],
  },
]);
