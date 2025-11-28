import "../styles/Inputs.css";

const Inputs = ({
  title,
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  error,
}) => {
  return (
    <div>
      <div className="title-input">
        <div className="icon-input">{Icon}</div>
        <div className="text-title-input">
          <p>{title}</p>
        </div>
      </div>
      <input
        className={`${error ? "input-error" : ""}`}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        style={
          type === "date"
            ? {
                fontFamily: "Poppins",
                fontSize: "0.9em",
                color: "#7a797aff",
                backgroundColor: "white",
              }
            : {}
        }
        
      />
    </div>
  );
};
export default Inputs;
