import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoginHero from '../../components/auth/LoginHero'
import LoginPanel from '../../components/auth/LoginPanel'
import { highlights, metrics } from '../../components/auth/loginData'
import { getRoleKey, getDashboardPath } from '../../config/navigation'
import './Login.css'

export default function Login() {
	const navigate = useNavigate()
	const { login } = useAuth()
	const [identifiant, setIdentifiant] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [feedback, setFeedback] = useState({ type: '', message: '' })
	const [showPassword, setShowPassword] = useState(false)

	useEffect(() => {
		document.title = 'GEP Nebula — Connexion'
	}, [])

	async function handleSubmit(event) {
		event.preventDefault()
		if (isLoading) return

		if (!identifiant.trim() || !password.trim()) {
			setFeedback({
				type: 'warning',
				message: 'Veuillez remplir votre identifiant et votre mot de passe avant de continuer.',
			})
			return
		}

		setFeedback({ type: '', message: '' })
		setIsLoading(true)

		try {
			const user = await login(identifiant.trim(), password)
			const roleKey = getRoleKey(user)
			navigate(getDashboardPath(roleKey), { replace: true })
		} catch (error) {
			console.error('Login failed', error)
			setFeedback({
				type: 'error',
				message: error?.response?.data?.error || error?.message || 'Erreur de connexion. Vérifiez vos identifiants.',
			})
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="login-page">
			<div className="login-orb login-orb-one" />
			<div className="login-orb login-orb-two" />
			<div className="login-grid">
				<LoginHero highlights={highlights} metrics={metrics} />

				<LoginPanel
					identifiant={identifiant}
					onIdentifiantChange={value => {
						setIdentifiant(value)
						if (feedback.message) setFeedback({ type: '', message: '' })
					}}
					password={password}
					onPasswordChange={value => {
						setPassword(value)
						if (feedback.message) setFeedback({ type: '', message: '' })
					}}
					showPassword={showPassword}
					onToggleShowPassword={() => setShowPassword(prev => !prev)}
					isLoading={isLoading}
					feedback={feedback}
					onSubmit={handleSubmit}
				/>
			</div>
		</div>
	)
}
