export const podePostarFoto = (dataFestaString) => {
  if (!dataFestaString) return false;

  // 1. Pega a data da festa (ex: "2025-10-11")
  // Adiciona T00:00:00 para garantir que o navegador entenda como data local
  const dataFesta = new Date(dataFestaString + "T00:00:00");

  // 2. Define o limite: Dia seguinte (+1 dia) às 12:00h
  const dataLimite = new Date(dataFesta);
  dataLimite.setDate(dataLimite.getDate() + 1); // Pula pro dia seguinte
  dataLimite.setHours(12, 0, 0, 0); // Define as 12:00:00

  // 3. Compara com agora
  const agora = new Date();

  // Retorna TRUE se ainda estiver dentro do prazo
  return agora < dataLimite;
};


