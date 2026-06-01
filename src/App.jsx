import { TeacherView } from "./routes/TeacherView.jsx";
import { ProjectorView } from "./routes/ProjectorView.jsx";

export default function App() {
  const isDisplayRoute = window.location.pathname === "/display";
  return isDisplayRoute ? <ProjectorView /> : <TeacherView />;
}
