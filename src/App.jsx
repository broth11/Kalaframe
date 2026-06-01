import { TeacherView } from "./routes/TeacherView.jsx";
import { ProjectorView } from "./routes/ProjectorView.jsx";
import { KalalightView } from "./routes/KalalightView.jsx";

export default function App() {
  const { pathname } = window.location;
  if (pathname.endsWith("/display")) return <ProjectorView />;
  if (pathname.endsWith("/full")) return <TeacherView />;
  return <KalalightView />;
}
