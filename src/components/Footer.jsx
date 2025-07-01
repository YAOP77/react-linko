import React from 'react';
import './Footer.css'; // Importation du fichier CSS

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                {/* Section 1: Logo et description */}
                <div className="footer-section footer-logo-description">
                    <h1>Linko</h1>
                    <p>
                        Linko est votre espace de conversation sécurisé
                        et fluide, conçu pour vous permettre de
                        communiquer librement avec vos proches, où
                        que vous soyez. Simple, rapide et protégé, Linko
                        vous rapproche de ceux qui comptent vraiment.
                    </p>
                </div>

                {/* Section 2: Accès rapide et réseaux sociaux */}
                <div className="footer-section footer-quick-links">
                    <h2>Accès rapide</h2>
                    <ul>
                        <li><a href="#">Accueil</a></li>
                        <li><a href="#">Se connecter</a></li>
                        <li><a href="#">S'inscrire</a></li>
                    </ul>
                    <div className="footer-social-icons">
                        <a href="#"><i className="fab fa-facebook-f"></i></a>
                        <a href="#"><i className="fab fa-instagram"></i></a>
                        <a href="#"><i className="fab fa-twitter"></i></a>
                        <a href="#"><i className="fab fa-linkedin-in"></i></a>
                    </div>
                </div>

                {/* Section 3: Formulaire de contact */}
                <div className="footer-section footer-contact">
                    <h2>Nous contacter</h2>
                    <form className="footer-contact-form">
                        <div className="form-row">
                            <input type="text" placeholder="Object" />
                            <input type="text" placeholder="Nom" />
                        </div>
                        <div className="form-row">
                            <input type="email" placeholder="Email" />
                            <input type="text" placeholder="Address" />
                        </div>
                        <textarea placeholder="Message"></textarea>
                        <button type="submit">Nous contacter</button>
                    </form>
                </div>
            </div>

            {/* Section du bas: Copyright */}
            <div className="footer-bottom">
                <p>&copy; Tous les droits sont réservés</p>
            </div>
        </footer>
    );
};

export default Footer; 