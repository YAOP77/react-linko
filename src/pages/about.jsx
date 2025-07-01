import React from 'react';
import { Link } from 'react-router-dom';
import portraitImg from '../assets/images/YAO-YAO-PASCAL.jpg';
import './about.css';

const About = () => {
  return (
    <div className="about-root">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>
            À propos de <span className="about-linko">Linko</span>
          </h1>
          <p>
            Une plateforme de messagerie moderne conçue pour faciliter les échanges et créer des connexions authentiques.
          </p>
        </div>
      </section>

      {/* Project Overview */}
      <section className="about-project">
        <div className="about-project-content">
          <h2>Le Projet</h2>
          <div className="about-project-grid">
            <div className="about-card">
              <h3>Objectif</h3>
              <p>
                Créer une application de messagerie complète avec des fonctionnalités modernes : chats privés, groupes, partage de médias et gestion de profils.
              </p>
            </div>
            <div className="about-card">
              <h3>Fonctionnalités</h3>
              <p>
                Messagerie en temps réel, création de groupes, partage de fichiers, système de blocage, messages sauvegardés et profils personnalisés.
              </p>
            </div>
            <div className="about-card">
              <h3>Architecture</h3>
              <p>
                Application full-stack avec frontend React, backend Node.js/Express, base de données MongoDB et communication temps réel via Socket.io.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="about-tech">
        <div className="about-tech-content">
          <h2>Technologies Utilisées</h2>
          <div className="about-tech-grid">
            <div className="about-card tech">
              <div className="about-icon react"><i className="fab fa-react"></i></div>
              <h3>React</h3>
              <p>Interface utilisateur</p>
            </div>
            <div className="about-card tech">
              <div className="about-icon node"><i className="fab fa-node-js"></i></div>
              <h3>Node.js</h3>
              <p>Runtime JavaScript</p>
            </div>
            <div className="about-card tech">
              <div className="about-icon express"><i className="fas fa-bolt"></i></div>
              <h3>Express</h3>
              <p>Framework backend</p>
            </div>
            <div className="about-card tech">
              <div className="about-icon mongo"><i className="fas fa-leaf"></i></div>
              <h3>MongoDB</h3>
              <p>Base de données</p>
            </div>
            <div className="about-card tech">
              <div className="about-icon socket"><i className="fas fa-plug"></i></div>
              <h3>Socket.io</h3>
              <p>Communication temps réel</p>
            </div>
            <div className="about-card tech">
              <div className="about-icon js"><i className="fab fa-js-square"></i></div>
              <h3>JavaScript</h3>
              <p>Langage principal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="about-dev">
        <div className="about-dev-content">
          <h2>Créateur de solution</h2>
          <div className="about-dev-flex">
            <div className="about-dev-profile">
              <div className="about-dev-img">
                <img src={portraitImg} alt="Pascal-Yao" />
              </div>
              <h3>Pascal Yao</h3>
              <p>Développeur Full-Stack</p>
            </div>
            <div className="about-dev-grid">
              <div className="about-card">
                <h4>Compétences</h4>
                <ul>
                  <li>Développement Frontend (React, HTML, CSS)</li>
                  <li>Développement Backend (Node.js, Express)</li>
                  <li>Développement Fulstack (Next.js)</li>
                  <li>Bases de données (MongoDB, SQL)</li>
                  <li>APIs RESTful</li>
                  <li>Communication temps réel (Socket.io)</li>
                  <li>Gestion de version (Git)</li>
                </ul>
              </div>
              <div className="about-card">
                <h4>Approche</h4>
                <p>
                  Focus sur la création d'applications web modernes avec une expérience utilisateur optimale et une architecture scalable en tout.
                </p>
                <p>
                  Passionné par les nouvelles technologies et les bonnes pratiques de développement.
                </p>
                <div className="about-dev-niveau">Niveau : Licence en science informatique</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About; 