import { TeacherView } from "./routes/TeacherView.jsx";
import { ProjectorView } from "./routes/ProjectorView.jsx";
import { KalalightView } from "./routes/KalalightView.jsx";

export default function App() {
  const { pathname } = window.location;
  if (pathname === "/display") return <ProjectorView />;
  if (pathname === "/full") return <TeacherView />;
  return <KalalightView />;
}
