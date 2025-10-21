import type { FC } from "react";

const NotConnected: FC = () => {
  return (
    <div className="unsupported-platform">
      <h2>Not connected</h2>
      <p>
        Sorry! We have trouble connecting to the server. <strong>Try again later!</strong>
      </p>
    </div>
  );
};

export default NotConnected;
