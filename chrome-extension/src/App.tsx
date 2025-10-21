import AuthProvider from "./Popup/AuthProvider";
import Popup from "./Popup/Popup";
import SocketProvider from "./Popup/SocketProvider";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Popup />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
