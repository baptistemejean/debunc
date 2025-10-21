import { useEffect, useState, type JSX } from "react";
import Icon from "../assets/Icon";
import { useAuth, useSocket } from "../hooks";
import { LogOut, Zap } from "react-feather";
import { connect } from "../socket";

interface IProps {
  children?: JSX.Element | JSX.Element[];
}

const Layout: React.FC<IProps> = ({ children }: IProps) => {
  const { getEmail, isAuthenticated } = useAuth();
  const { socket, useListener } = useSocket();

  const [email, setEmail] = useState<string>();
  const [requestsLeft, setRequestsLeft] = useState<number>();

  useEffect(() => {
    useListener("update", (data) => setRequestsLeft(data.requestsLeft));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getEmail()
        .then((v) => setEmail(v))
        .catch((e) => console.log(e));
    }
  }, [isAuthenticated]);

  return (
    <div className="container">
      {/* Header */}
      <header className="header-container">
        <div className="header">
          <div className="title-section-start">
            <Icon color="white"></Icon>
            <h1 className="title">debunc</h1>
          </div>
          {requestsLeft && (
            <div className="requests-left">
              {requestsLeft}
              <Zap fill="white" color="white" size={12}></Zap> <div className="requests-left-overlay">Free requests left </div>
            </div>
          )}
        </div>
      </header>
      {children}
      <footer className="footer">
        <div className="title-section-end">
          Supports <img className="x-icon" src="x-icon.svg" alt="X icon" />
          <img className="chrome-icon" src="chrome-icon.svg" alt="X icon" />
        </div>
        {/* <span>Logged in as {email}</span> */}
        {/* <span className="logout-button" onClick={() => logout()}>
          <LogOut size={15}></LogOut>
        </span> */}
      </footer>
    </div>
  );
};

export default Layout;
