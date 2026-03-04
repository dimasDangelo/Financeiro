const useValidate = () => {
  const validateInput = (valid: boolean) => {
    if (!valid) {
      return "Campo obrigatório";
    }

    return null;
  };

  return {
    validateInput,
  };
};

export default useValidate;
