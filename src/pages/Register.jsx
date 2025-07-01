import React, { useState } from 'react';
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import './Register.css';

const Register = () => {
    const [ formData, setFormData ] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [ message, SetMessage ] = useState({ type: "", text: "" });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    const validateForm = () => {
        if(!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            SetMessage({ type: "error", text:"Veuillez remplir tous les champs" });
            return false;
        }

        if(!formData.email.includes("@")) {
            SetMessage({ type: "Email invalide"});
            return false;
        }

        if (formData.password.length < 8) {
            SetMessage({ type: "error", text: "Le mot de passe doit avoir au moins 8 caractères" });
            return false;
        }

        if(formData.password !== formData.confirmPassword) {
            SetMessage({ type:"error", text:"Les mots de passe doivent etre identique" });
            return false
        }
        return true;
    }

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!validateForm()) return;

        try {
            const response = await registerUser(formData);
            SetMessage({ type: "success", text: "Enregistrement réussie veuillez vous connecter"})
            setTimeout(() => navigate("/login"), 2000);
        } catch (error) {
            SetMessage({ type: "error", text: error.message });
        }
    }

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <main className="register-container">
            <div className="register-form">
                <h2>Crée un compte</h2>
                <p>Vous avez déjà un compte ? <a href="/login">Connectez-vous</a></p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Nom utilisateur</label>
                        <input type="text"  id="username" name="username" value={formData.username} placeholder="Entrer votre nom" onChange={handleChange}  />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email"  id="email" name="email" value={formData.email} placeholder="Entrer votre email" onChange={handleChange} />
                    </div>

                    <div className="form-group password-input-wrapper">
                        <label htmlFor="password">Mot de passe</label>
                        <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} placeholder="Entrer votre mot de passe" onChange={handleChange}/>
                        <span className="password-toggle-icon" onClick={togglePasswordVisibility}><i class="fa-regular fa-eye"></i></span>
                    </div>

                    <div className="form-group password-input-wrapper">
                        <label htmlFor="confirmPassword">Confirmation du mot de passe</label>
                        <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} placeholder="Confirmer votre mot de passe" onChange={handleChange} />
                        <span className="password-toggle-icon" onClick={toggleConfirmPasswordVisibility}><i class="fa-regular fa-eye"></i></span>
                    </div>

                    <button type="submit" className="submit-btn btn-blue">Je m'inscris</button>
                    {message.text &&(
                        <p className={message.type === "error" ? "error-msg" : "success-msg" }>
                            { message.text }
                        </p>
                    )}
                </form>
            </div>
        </main>
    )
}

export default Register;