import { useEffect } from "react";
import { ROUTES } from "../routes";

const CreateEventPage = () => {

  useEffect(() => {
    document.title = "Criar Festa | GoPic";
  }, []);
  return(
    <div>
    <div>Criar Festa</div>
  </div>
  )
};

export default CreateEventPage;
