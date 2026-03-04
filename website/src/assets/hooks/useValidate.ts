
const useValidate = () => {

  const validateInput = (valid) => {
    
    if(!valid) {
        return <span>Campo obrigatório</span>;
    }
    return null;
  };


  return {
    validateInput,
  };
};

export default useValidate