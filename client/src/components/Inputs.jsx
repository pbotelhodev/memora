import "../styles/Inputs.css";

const Inputs = ({
  title,
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  req,
  error,
  cupomAtivo,
  maxLen
}) => {
  return (
    <div className="box-input">
      <div className="title-input">
        <div className="icon-input">{Icon}</div>
        <div className="text-title-input">
          <p>
            {title}
            {req && <span style={{ color: "red" }}> *</span>}
          </p>
        </div>
      </div>
      <input
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        required={req}
        onBlur={onBlur}
        style={{ borderColor: error === true ? "#EF4444" : "#334155" }}
        maxLength={title === "Nome da Festa" ? maxLen : null}
      />
      {error === true ? (
        <p className="subtitle-input">
          {title === "CPF"
            ? "CPF "
            : title === "Whatsapp"
            ? "Telefone "
            : title === "Data do evento"
            ? "Data "
            : title === "CEP"
            ? "CEP "
            : null}
          Inválido.
        </p>
      ) : null}

      {title === "CPF" ? (
        <p className="subtitle-input">Necessário para emissão de NF-E</p>
      ) : null}
      {title === "Data do evento" ? (
        <p className="subtitle-input">Fotos disponíveis em 48h.</p>
      ) : null}
      {title === "Cupom" && cupomAtivo === 1 ? (
        <p className="subtitle-input color-green">Desconto aplicado</p>
      ) : null}
      {title === "Cupom" && cupomAtivo === 2 ? (
        <p className="subtitle-input color-red">Cupom Inválido</p>
      ) : null}
    </div>
  );
};
export default Inputs;
