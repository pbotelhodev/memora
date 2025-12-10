// src/utils/dateRules.js

export const getPrazoLimite = (dataFestaString) => {
  if (!dataFestaString) return null;

  const dataFesta = new Date(dataFestaString + "T00:00:00");

  const dataLimite = new Date(dataFesta);
  dataLimite.setDate(dataLimite.getDate() + 1);
  dataLimite.setHours(12, 0, 0, 0);

  return dataLimite;
};

export const podePostarFoto = (dataFestaString) => {
  const limite = getPrazoLimite(dataFestaString);
  if (!limite) return false;

  const agora = new Date();
  return agora < limite;
};

export const isDownloadLiberado = (dataFestaString) => {
  const limite = getPrazoLimite(dataFestaString);
  if (!limite) return false;

  const agora = new Date();
  return agora >= limite;
};
