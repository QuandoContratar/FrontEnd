// Função para expandir/recolher seções
window.toggleSection = function(section) {
	const content = document.getElementById(section + '-content');
	const chevron = document.getElementById(section + '-chevron');
	if (!content || !chevron) {
		console.warn(`Elementos não encontrados para seção: ${section}`);
		return;
	}
	
	// Toggle da classe show
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
	setText('#candidateName', candidato.name || 'Nome não informado');
	setText('#candidateEmail', candidato.email || 'Email não informado');
	setText('#candidatePhone', candidato.phoneNumber || 'Telefone não informado');
	setText('#candidateState', candidato.state || 'Estado não informado');
	setText('#candidateBirth', formatarData(candidato.birth) || 'Data não informada');
	renderEducation(candidato.education);
	renderSkills(candidato.skills);
	renderExperience(candidato.experience);
	renderProfilePicture(candidato.profilePicture);
}

function formatarData(data) {
	if (!data) return '';
	try {
		const date = new Date(data);
		return date.toLocaleDateString('pt-BR');
	} catch (e) {
		return data;
	}
}

function setText(selector, value) {
	const el = document.querySelector(selector);
	if (el) el.textContent = value || '';
}

function renderEducation(education) {
	const container = document.getElementById('education-items');
	if (!container) return;
	container.innerHTML = '';
	
	if (education) {
		// Se education é uma string, tenta parsear como JSON ou trata como texto simples
		let educationData;
		try {
			educationData = typeof education === 'string' ? JSON.parse(education) : education;
		} catch (e) {
			// Se não for JSON, trata como texto simples
			const educationItem = document.createElement('div');
			educationItem.className = 'education-item';
			educationItem.innerHTML = `<p>${education}</p>`;
			container.appendChild(educationItem);
			return;
		}
		
		// Se for array, renderiza cada item
		if (Array.isArray(educationData)) {
			educationData.forEach(edu => {
				const item = document.createElement('div');
				item.className = 'education-item';
				item.innerHTML = `
					<h6>${edu.title || edu.nome || 'Educação'}</h6>
					${edu.institution ? `<p><strong>Instituição:</strong> ${edu.institution}</p>` : ''}
					${edu.period ? `<p><strong>Período:</strong> ${edu.period}</p>` : ''}
					${edu.status ? `<p><strong>Status:</strong> ${edu.status}</p>` : ''}
				`;
				container.appendChild(item);
			});
		} else if (typeof educationData === 'object') {
			// Se for um objeto único
			const item = document.createElement('div');
			item.className = 'education-item';
			item.innerHTML = `
				<h6>${educationData.title || educationData.nome || 'Educação'}</h6>
				${educationData.institution ? `<p><strong>Instituição:</strong> ${educationData.institution}</p>` : ''}
				${educationData.period ? `<p><strong>Período:</strong> ${educationData.period}</p>` : ''}
				${educationData.status ? `<p><strong>Status:</strong> ${educationData.status}</p>` : ''}
			`;
			container.appendChild(item);
		}
	} else {
		container.innerHTML = '<p class="text-muted">Nenhuma escolaridade informada.</p>';
	}
}

function renderSkills(skills) {
	const container = document.getElementById('skills-items');
	if (!container) return;
	container.innerHTML = '';
	
	if (skills) {
		// Se skills é uma string, tenta separar por vírgula ou parsear como JSON
		let skillsArray;
		try {
			skillsArray = typeof skills === 'string' ? JSON.parse(skills) : skills;
		} catch (e) {
			// Se não for JSON, separa por vírgula
			skillsArray = skills.split(',').map(s => s.trim());
		}
		
		if (Array.isArray(skillsArray)) {
			skillsArray.forEach(skill => {
				const tag = document.createElement('div');
				tag.className = 'skill-tag';
				tag.textContent = typeof skill === 'string' ? skill : (skill.name || skill);
				container.appendChild(tag);
			});
		} else if (typeof skillsArray === 'string') {
			const tag = document.createElement('div');
			tag.className = 'skill-tag';
			tag.textContent = skillsArray;
			container.appendChild(tag);
		}
	} else {
		container.innerHTML = '<p class="text-muted">Nenhuma competência informada.</p>';
	}
}

function renderExperience(experience) {
	const container = document.getElementById('experience-items');
	if (!container) return;
	container.innerHTML = '';
	
	if (experience) {
		// Se experience é uma string, tenta parsear como JSON ou trata como texto simples
		let experienceData;
		try {
			experienceData = typeof experience === 'string' ? JSON.parse(experience) : experience;
		} catch (e) {
			// Se não for JSON, trata como texto simples
			const experienceItem = document.createElement('div');
			experienceItem.className = 'experience-item';
			experienceItem.innerHTML = `<p>${experience}</p>`;
			container.appendChild(experienceItem);
			return;
		}
		
		// Se for array, renderiza cada item
		if (Array.isArray(experienceData)) {
			experienceData.forEach(exp => {
				const item = document.createElement('div');
				item.className = 'experience-item';
				item.innerHTML = `
					<h6>${exp.title || exp.position || exp.cargo || 'Experiência'}</h6>
					${exp.company || exp.empresa ? `<p><strong>Empresa:</strong> ${exp.company || exp.empresa}</p>` : ''}
					${exp.period || exp.periodo ? `<p><strong>Período:</strong> ${exp.period || exp.periodo}</p>` : ''}
					${exp.description || exp.descricao ? `<p><strong>Descrição:</strong> ${exp.description || exp.descricao}</p>` : ''}
				`;
				container.appendChild(item);
			});
		} else if (typeof experienceData === 'object') {
			// Se for um objeto único
			const item = document.createElement('div');
			item.className = 'experience-item';
			item.innerHTML = `
				<h6>${experienceData.title || experienceData.position || experienceData.cargo || 'Experiência'}</h6>
				${experienceData.company || experienceData.empresa ? `<p><strong>Empresa:</strong> ${experienceData.company || experienceData.empresa}</p>` : ''}
				${experienceData.period || experienceData.periodo ? `<p><strong>Período:</strong> ${experienceData.period || experienceData.periodo}</p>` : ''}
				${experienceData.description || experienceData.descricao ? `<p><strong>Descrição:</strong> ${experienceData.description || experienceData.descricao}</p>` : ''}
			`;
			container.appendChild(item);
		} else {
			// Se for apenas texto
			const item = document.createElement('div');
			item.className = 'experience-item';
			item.innerHTML = `<p>${experienceData}</p>`;
			container.appendChild(item);
		}
	} else {
		container.innerHTML = '<p class="text-muted">Nenhuma experiência informada.</p>';
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

// Função para download do currículo
window.downloadResume = async function() {
	const candidateId = localStorage.getItem('selectedCandidateId');
	if (!candidateId) {
		alert('Nenhum candidato selecionado.');
		return;
	}
	
	try {
		const client = new CandidateClient();
		const resumeBlob = await client.downloadResume(candidateId);
		
		// Cria um link temporário para download
		const url = window.URL.createObjectURL(new Blob([resumeBlob], { type: 'application/pdf' }));
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', `curriculo_${candidateId}.pdf`);
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(url);
	} catch (error) {
		console.error('Erro ao baixar currículo:', error);
		alert('Erro ao baixar currículo. Tente novamente.');
	}
}

// Função para excluir candidato
window.excludeCandidate = async function() {
	const candidateId = localStorage.getItem('selectedCandidateId');
	if (!candidateId) {
		alert('Nenhum candidato selecionado.');
		return;
	}
	
	const confirmacao = confirm('Tem certeza que deseja excluir este candidato?');
	if (!confirmacao) return;
	
	try {
		const client = new CandidateClient();
		await client.delete(candidateId);
		alert('Candidato excluído com sucesso!');
		window.location.href = 'candidatos.html';
	} catch (error) {
		console.error('Erro ao excluir candidato:', error);
		alert('Erro ao excluir candidato. Tente novamente.');
	}
}
