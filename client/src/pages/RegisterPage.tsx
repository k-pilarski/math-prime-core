import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    try {
      setServerError(null);
      
      await axios.post('http://localhost:3000/api/auth/register', {
        email: data.email,
        password: data.password
      });

      alert("Rejestracja udana! Możesz się teraz zalogować.");
      navigate('/');

    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        setServerError(error.response.data.error);
      } else {
        setServerError("Wystąpił błąd połączenia z serwerem.");
      }
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h2>Załóż konto</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div>
          <label>Email:</label>
          <input 
            {...register("email", { required: "Email jest wymagany" })} 
            type="email" 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.email && <span style={{ color: 'red', fontSize: '12px' }}>{errors.email.message as string}</span>}
        </div>

        <div>
          <label>Hasło:</label>
          <input 
            {...register("password", { required: "Hasło jest wymagane", minLength: { value: 6, message: "Minimum 6 znaków" } })} 
            type="password" 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {errors.password && <span style={{ color: 'red', fontSize: '12px' }}>{errors.password.message as string}</span>}
        </div>

        {serverError && <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>{serverError}</div>}

        <button type="submit" style={{ padding: '10px', background: 'blue', color: 'white', border: 'none', cursor: 'pointer' }}>
          Zarejestruj się
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;