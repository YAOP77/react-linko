import React, { useState, useEffect, useRef } from 'react';
import img1 from './../assets/images/portrait-person-with-chain-necklace.png';
import img2 from './../assets/images/smiley-homme-portant-une-chemise-blanche-coup-moyen-removebg-preview.png';
import img3 from './../assets/images/coup-moyen-homme-avec-une-coiffure-afro-removebg-preview.png';
import img4 from './../assets/images/clientele-joyeuse-joyeuse-posant-pour-la-camera-removebg-preview.png';
import img5 from './../assets/images/portrait1-man-removebg-preview.png';
import phoneImg from './../assets/images/Phone-removebg-preview.png';

// Fonction utilitaire pour mélanger un tableau (algorithme de Fisher-Yates)
const shuffleArray = (array) => {
    let currentIndex = array.length,
        randomIndex;

    // Tant qu'il reste des éléments à mélanger.
    while (currentIndex !== 0) {
        // Choisir un élément restant.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // Et l'échanger avec l'élément actuel.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
};

const initialAvatarSources = [img1, img3, img4, img2, img5];

const Home = () => {
    const [animated, setAnimated] = useState(false);
    const [currentAvatarSources, setCurrentAvatarSources] = useState(initialAvatarSources);
    const [imageOpacities, setImageOpacities] = useState(initialAvatarSources.map(() => 1)); // Toutes visibles initialement

    const knowledgeTitleRef = useRef(null);
    const conversationRef = useRef(null); // Nouvelle référence pour les bulles de discussion
    const section3Ref = useRef(null); // Nouvelle référence pour la section 3
    const buttonGroupRef = useRef(null);

    useEffect(() => {
        const timer1 = setTimeout(() => {
            setAnimated(true);
        }, 100);

        const animationLoop = setInterval(() => {
            let idx1 = Math.floor(Math.random() * initialAvatarSources.length);
            let idx2 = Math.floor(Math.random() * initialAvatarSources.length);
            while (idx1 === idx2) {
                idx2 = Math.floor(Math.random() * initialAvatarSources.length);
            }

            setImageOpacities(prevOpacities => {
                const newOpacities = [...prevOpacities];
                newOpacities[idx1] = 0;
                newOpacities[idx2] = 0;
                return newOpacities;
            });

            const swapTimer = setTimeout(() => {
                setCurrentAvatarSources(prevSources => {
                    const newSources = [...prevSources];
                    [newSources[idx1], newSources[idx2]] = [newSources[idx2], newSources[idx1]];
                    return newSources;
                });

                const fadeInTimer = setTimeout(() => {
                    setImageOpacities(prevOpacities => {
                        const finalOpacities = [...prevOpacities];
                        finalOpacities[idx1] = 1;
                        finalOpacities[idx2] = 1;
                        return finalOpacities;
                    });
                }, 50);

                return () => clearTimeout(fadeInTimer);
            }, 700);

            return () => clearTimeout(swapTimer);

        }, 3000);

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1,
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-on-scroll');
                    observer.unobserve(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        if (knowledgeTitleRef.current) {
            observer.observe(knowledgeTitleRef.current);
        }
        if (conversationRef.current) {
            observer.observe(conversationRef.current);
        }
        if (section3Ref.current) {
            observer.observe(section3Ref.current);
        }
        if (buttonGroupRef.current) {
            observer.observe(buttonGroupRef.current);
        }

        return () => {
            clearTimeout(timer1);
            clearInterval(animationLoop);
            if (knowledgeTitleRef.current) {
                observer.unobserve(knowledgeTitleRef.current);
            }
            if (conversationRef.current) {
                observer.unobserve(conversationRef.current);
            }
            if (section3Ref.current) {
                observer.unobserve(section3Ref.current);
            }
            if (buttonGroupRef.current) {
                observer.unobserve(buttonGroupRef.current);
            }
        };
    }, []);

    return (
        <>
            <section className="section-1" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px 20px', boxSizing: 'border-box', backgroundColor: '#111010', color: 'white', margin: '0' }}>
                <div className="container-new-section-1" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', maxWidth: '1400px', width: '100%', gap: '50px' }}>
                    <div className="text-content" style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                        <h1 className={animated ? 'fade-in-up' : ''} style={{ fontSize: '2.6em', lineHeight: '1em', marginLeft: "60px", fontWeight: 'bold', textAlign: 'center', marginBottom: "50px", overflowWrap: "break-word" }}>
                            <span style={{ fontSize: '2.2em', color: '#2563eb', fontWeight: 900, letterSpacing: 1 }}>Linko</span><br/>
                            Connectez-vous, échangez, et créez des liens authentiques
                        </h1>
                        <a href="/about"><button className={animated ? 'fade-in-up delay-1' : ''} style={{ padding: '12px 25px', fontSize: '1.1em', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', marginTop: '15px' }}>À propos</button></a>
                </div>
                    <div className="image-avatars-content" style={{ flex: 1, minWidth: '400px', height: '400px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {currentAvatarSources.map((src, index) => (
                            <div key={`avatar-slot-${index}`} className={`avatar avatar-${index + 1}`} style={{
                                position: 'absolute',
                                width: '90px',
                                height: '90px',
                                borderRadius: '50%',
                                border: '3px solid #3b82f6',
                                overflow: 'hidden',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                transition: 'all 1s ease-in-out',
                                top: index === 0 ? '10%' : index === 1 ? '40%' : index === 2 ? '70%' : index === 3 ? '40%' : '10%',
                                left: index === 0 ? '25%' : index === 1 ? '10%' : index === 2 ? '35%' : 'auto',
                                right: index === 3 ? '10%' : index === 4 ? '25%' : 'auto',
                                transform: 'none',
                                zIndex: 5 - index
                            }}>
                                <img
                                src={src}
                                alt={`Avatar ${index + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.7s ease-in-out', opacity: imageOpacities[index] }}
                            />
                        </div>
                    ))}
                    </div>
                </div>
            </section>

            <section className="section-2" style={{ backgroundColor: '#171717', padding: '80px 20px', color: 'white', textAlign: 'center', margin: '0' }}>
                <div className="container-section-2" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', maxWidth: '1400px', margin: '0 auto', gap: '50px' }}>
                    <div className="conversation-images" ref={conversationRef} style={{ flex: 1, minWidth: '300px', position: 'relative', height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div className="conversation-bubble bubble-1">Joyeux anniversaire à toi &#129322;</div>
                        <div className="conversation-bubble bubble-2">Porte-toi bien &#129321;</div>
                        <div className="conversation-bubble bubble-3">Merci &#x2764;&#xfe0f;&#x2764;&#xfe0f;</div>
                        <div className="conversation-bubble bubble-4">Félicitation tu es un chef</div>
                    </div>
                    <div className="text-content-section-2" ref={knowledgeTitleRef} style={{ flex: 1, minWidth: '300px', textAlign: 'left', paddingRight: '20px' }}>
                        <h2 className="knowledge-title" style={{ color: '#facc15', fontSize: '3em', fontWeight: '700', marginBottom: '20px' }}>Partagez des moments avec vos proches</h2>
                        <p className="knowledge-description" style={{ color: '#9ca3af', fontSize: '1rem', lineHeight: '1.6', marginBottom: '20px' }}>
                            Sur Linko, la connexion avec vos proches est fluide, intuitive et
                            entièrement sécurisée.
                        </p>
                        <p className="knowledge-description" style={{ color: '#9ca3af', fontSize: '1rem', lineHeight: '1.6' }}>
                            Que ce soit pour échanger des nouvelles, partager des moments
                            précieux ou simplement discuter, Linko vous offre un espace de
                            communication sans limite et protégé. Grâce à un système de
                            chiffrement avancé, vos messages restent privés et accessibles
                            uniquement aux personnes que vous choisissez.
                        </p>
                    </div>
                </div>
            </section>

            <section className="section-3" ref={section3Ref} style={{ backgroundColor: '#111010', color: 'white', textAlign: 'center' }}>
                <h2 className="section-3-title">Menez des actions simples</h2>
                <div className="section-3-content">
                    <div className="phone-image-container">
                        <img src={phoneImg} alt="Phone showing chat app" className="phone-image" />
                    </div>
                    <div className="steps-container">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <div className="step-text">
                                <h3>S'inscrire / Se connecter</h3>
                                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nam</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <div className="step-text">
                                <h3>Contacter / Rejoindre un canal</h3>
                                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nam</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <div className="step-text">
                                <h3>Discuter</h3>
                                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nam</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section-4" style={{ backgroundColor: '#171717', padding: '60px 20px', color: 'white', textAlign: 'center', margin: '0' }}>
                <div className="container-section-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2.5em', fontWeight: '600', marginBottom: '15px', color: '#fff' }}>
                        Fonctionnalités
                    </h2>
                    <p style={{ fontSize: '1.1em', color: '#9ca3af', marginBottom: '50px' }}>
                        Tout ce que vous pouvez faire sur Linko
                    </p>
                    
                    <div className="features-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                        gap: '25px'
                    }}>
                        <div className="feature-card" style={{
                            backgroundColor: '#111010',
                            padding: '25px',
                            borderRadius: '8px',
                            border: '1px solid #3d3d3d'
                        }}>
                            <div style={{ fontSize: '2.5em', marginBottom: '15px', color: '#2563eb' }}>
                                <i className="fas fa-comments"></i>
                            </div>
                            <h3 style={{ fontSize: '1.3em', marginBottom: '10px', color: '#fff' }}>Chats Privés</h3>
                            <p style={{ color: '#9ca3af', lineHeight: '1.5', fontSize: '0.95em' }}>
                                Messages privés avec vos contacts
                            </p>
                        </div>

                        <div className="feature-card" style={{
                            backgroundColor: '#111010',
                            padding: '25px',
                            borderRadius: '8px',
                            border: '1px solid #3D3D3D'
                        }}>
                            <div style={{ fontSize: '2.5em', marginBottom: '15px', color: '#2563eb' }}>
                                <i className="fas fa-users"></i>
                            </div>
                            <h3 style={{ fontSize: '1.3em', marginBottom: '10px', color: '#fff' }}>Groupes</h3>
                            <p style={{ color: '#9ca3af', lineHeight: '1.5', fontSize: '0.95em' }}>
                                Créez et rejoignez des groupes de discussion
                            </p>
                        </div>

                        <div className="feature-card" style={{
                            backgroundColor: '#111010',
                            padding: '25px',
                            borderRadius: '8px',
                            border: '1px solid #3D3D3D'
                        }}>
                            <div style={{ fontSize: '2.5em', marginBottom: '15px', color: '#2563eb' }}>
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <h3 style={{ fontSize: '1.3em', marginBottom: '10px', color: '#fff' }}>Sécurité</h3>
                            <p style={{ color: '#9ca3af', lineHeight: '1.5', fontSize: '0.95em' }}>
                                Blocage d'utilisateurs et protection des données
                            </p>
                        </div>

                        <div className="feature-card" style={{
                            backgroundColor: '#111010',
                            padding: '25px',
                            borderRadius: '8px',
                            border: '1px solid #3D3D3D'
                        }}>
                            <div style={{ fontSize: '2.5em', marginBottom: '15px', color: '#2563eb' }}>
                                <i className="fas fa-image"></i>
                            </div>
                            <h3 style={{ fontSize: '1.3em', marginBottom: '10px', color: '#fff' }}>Médias</h3>
                            <p style={{ color: '#9ca3af', lineHeight: '1.5', fontSize: '0.95em' }}>
                                Partagez photos et vidéos
                            </p>
                        </div>

                        <div className="feature-card" style={{
                            backgroundColor: '#111010',
                            padding: '25px',
                            borderRadius: '8px',
                            border: '1px solid #3D3D3D'
                        }}>
                            <div style={{ fontSize: '2.5em', marginBottom: '15px', color: '#2563eb' }}>
                                <i className="fas fa-bookmark"></i>
                            </div>
                            <h3 style={{ fontSize: '1.3em', marginBottom: '10px', color: '#fff' }}>Favoris</h3>
                            <p style={{ color: '#9ca3af', lineHeight: '1.5', fontSize: '0.95em' }}>
                                Sauvegardez vos messages importants
                            </p>
                        </div>

                        <div className="feature-card" style={{
                            backgroundColor: '#111010',
                            padding: '25px',
                            borderRadius: '8px',
                            border: '1px solid #3D3D3D'
                        }}>
                            <div style={{ fontSize: '2.5em', marginBottom: '15px', color: '#2563eb' }}>
                                <i className="fas fa-user-circle"></i>
                            </div>
                            <h3 style={{ fontSize: '1.3em', marginBottom: '10px', color: '#fff' }}>Profil</h3>
                            <p style={{ color: '#9ca3af', lineHeight: '1.5', fontSize: '0.95em' }}>
                                Personnalisez votre profil utilisateur
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default Home; 