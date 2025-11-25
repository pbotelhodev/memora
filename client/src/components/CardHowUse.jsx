import '../styles/CardHowUse.css'

const CardHowUse = ({ icon: Icon, title, subtitle }) => {
  return (
    <div className="card">
      <div className="icon-card">{Icon}</div>
      <div className="title-card">
        <h1>{title}</h1>
      </div>
      <div className="subtitle-card">
        <p>{subtitle}</p>
      </div>
    </div>
  );
};

export default CardHowUse;
