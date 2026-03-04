

const FieldError = ({error ,msg = "Verifique o campo!" }: { error: boolean, msg?: string}) => {

if(!error) return null;

  return ( 
    <span style={{color: 'red', fontSize: '12px'}}>
        {msg}
        </span>

   );
}
export default FieldError;