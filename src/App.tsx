import { useState } from "react";
import ApiTable from "./ApiTable";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <ApiTable />
    </>
  );
}

export default App;
