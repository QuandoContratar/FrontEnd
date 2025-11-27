// Função para expandir/recolher seções
window.toggleSection = function(section) {
	const content = document.getElementById(section + '-content');
	const chevron = document.getElementById(section + '-chevron');
	if (!content || !chevron) return;
	if (content.classList.contains('show')) {
		content.classList.remove('show');
		chevron.classList.remove('rotated');
	} else {
		content.classList.add('show');
		chevron.classList.add('rotated');
	}
}
// Script para preencher detalhes do candidato usando sessionStorage e CandidateClient
import { CandidateClient } from '../../../client/client.js';

async function carregarCandidato() {
	const candidateId = localStorage.getItem('selectedCandidateId');
	if (!candidateId) {
		mostrarErro('Nenhum candidato selecionado.');
		return;
	}
	try {
		const client = new CandidateClient();
		const candidato = await client.findById(candidateId);
		console.log("🚀 ~ candidato:", candidato)
		preencherCampos(candidato);
	} catch (e) {
		mostrarErro('Erro ao carregar dados do candidato.');
	}
}

carregarCandidato();

function preencherCampos(candidato) {
	setText('#candidateName', candidato.name);
	setText('#candidateEmail', candidato.email);
	setText('#candidatePhone', candidato.phoneNumber);
	setText('#candidateState', candidato.state);
	setText('#candidateBirth', candidato.birth);
	setText('#candidateEducation', candidato.education || 'Não informado');
	renderSkills(candidato.skills);
	renderExperience(candidato.experience);
	renderProfilePicture(candidato.profilePicture);
}

function setText(selector, value) {
	const el = document.querySelector(selector);
	if (el) el.textContent = value || '';
}

function renderSkills(skills) {
	const container = document.querySelector('#candidateSkills');
	if (!container) return;
	container.innerHTML = '';
	if (skills) {
		skills.split(',').forEach(skill => {
			const tag = document.createElement('span');
			tag.className = 'skill-tag';
			tag.textContent = skill.trim();
			container.appendChild(tag);
		});
	} else {
		container.innerHTML = '<span class="text-muted">Nenhuma competência informada.</span>';
	}
}

function renderExperience(experience) {
	const container = document.querySelector('#candidateExperience');
	if (!container) return;
	container.innerHTML = '';
	if (experience) {
		container.textContent = experience;
	}
}

function renderProfilePicture(url) {
	const img = document.querySelector('#candidatePhoto');
	if (img && url) {
		img.src = url;
	}
}

function mostrarErro(msg) {
	const container = document.querySelector('#candidateError');
	if (container) {
		container.textContent = msg;
		container.style.display = 'block';
	} else {
		alert(msg);
	}
}
