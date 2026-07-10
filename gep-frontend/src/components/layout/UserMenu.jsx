import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { getRoleKey, ROLE_LABELS } from '../../config/navigation'
import './UserMenu.css'

export default function UserMenu() {
	const { user, logout } = useAuth()
	const navigate = useNavigate()
	const [open, setOpen] = useState(false)
	const rootRef = useRef(null)

	useEffect(() => {
		if (!open) return undefined

		function handlePointerDown(event) {
			if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
		}
		function handleKeyDown(event) {
			if (event.key === 'Escape') setOpen(false)
		}

		document.addEventListener('mousedown', handlePointerDown)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('mousedown', handlePointerDown)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [open])

	const displayName = user?.nom || user?.login || 'Utilisateur'
	const initials = displayName
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(part => part[0].toUpperCase())
		.join('') || '?'
	const roleLabel = ROLE_LABELS[getRoleKey(user)] || user?.role || ''

	async function handleLogout() {
		setOpen(false)
		await logout()
		navigate('/login', { replace: true })
	}

	return (
		<div className="user-menu" ref={rootRef}>
			<button
				type="button"
				className="user-menu-trigger"
				onClick={() => setOpen(prev => !prev)}
				aria-haspopup="true"
				aria-expanded={open}
			>
				<span className="user-menu-avatar">{initials}</span>
				<span className="user-menu-info">
					<span className="user-menu-name">{displayName}</span>
					{roleLabel && <span className="user-menu-role">{roleLabel}</span>}
				</span>
				<span className={`user-menu-chevron${open ? ' is-open' : ''}`} aria-hidden="true">⌄</span>
			</button>

			{open && (
				<div className="user-menu-dropdown" role="menu">
					<div className="user-menu-dropdown-header">
						<div className="user-menu-dropdown-name">{displayName}</div>
						{roleLabel && <div className="user-menu-dropdown-role">{roleLabel}</div>}
					</div>
					<button
						type="button"
						role="menuitem"
						className="user-menu-item user-menu-item-danger"
						onClick={handleLogout}
					>
						<span aria-hidden="true">🚪</span> Déconnexion
					</button>
				</div>
			)}
		</div>
	)
}
