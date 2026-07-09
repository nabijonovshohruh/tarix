import { Link } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { uz } from "../../i18n/uz";
import { useAuth } from "../../context/AuthContext";

const tiles = [
  { to: "/tests", icon: "📚", title: uz.home.tests, desc: uz.home.testsDesc },
  { to: "/attendance", icon: "🗓️", title: uz.home.attendance, desc: uz.home.attendanceDesc },
  { to: "/exams", icon: "📝", title: uz.home.exams, desc: uz.home.examsDesc },
  { to: "/leaderboard", icon: "🏆", title: uz.home.leaderboard, desc: uz.home.leaderboardDesc },
];

export function HomeScreen() {
  const { user } = useAuth();

  return (
    <div>
      <Header title={uz.home.title} subtitle={uz.home.teacherLabel} />
      <div className="space-y-4 p-4">
        <Card className="bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <p className="text-sm opacity-90">{uz.home.subtitle}</p>
          {user && <p className="mt-2 text-lg font-semibold">Salom, {user.fullName}!</p>}
        </Card>

        <div className="grid grid-cols-1 gap-3">
          {tiles.map((tile) => (
            <Link key={tile.to} to={tile.to}>
              <Card className="flex items-center gap-4 transition hover:border-brand-300 active:scale-[0.99]">
                <span className="text-3xl">{tile.icon}</span>
                <div>
                  <p className="font-semibold">{tile.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{tile.desc}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
