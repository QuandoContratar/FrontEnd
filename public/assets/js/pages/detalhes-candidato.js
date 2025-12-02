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

// Script para preencher detalhes do candidato usando localStorage e CandidateClient
import { CandidateClient } from '../../../client/client.js';

async function carregarCandidato() {
	const candidateId = localStorage.getItem('selectedCandidateId');
	if (!candidateId) {
		mostrarErro('Nenhum candidato selecionado.');
		return;
	}
	try {
		const client = new CandidateClient();
		// Busca dados básicos do candidato
		const candidato = await client.findById(candidateId);
		console.log("🚀 ~ candidato:", candidato);
		
		// Preenche informações básicas
		preencherCamposBasicos(candidato);
		
		// Busca detalhes completos (pode ter mais informações)
		try {
			const detalhes = await client.getCandidateDetails(candidateId);
			if (detalhes) {
				preencherDetalhes(detalhes);
			}
		} catch (e) {
			console.warn('Erro ao buscar detalhes completos:', e);
		}
		
		// Busca experiência separadamente
		try {
			const experiencia = await client.getCandidateExperience(candidateId);
			renderExperience(experiencia);
		} catch (e) {
			console.warn('Erro ao buscar experiência:', e);
			renderExperience(null);
		}
		
		// Preenche escolaridade e competências dos dados básicos
		renderEducation(candidato.education);
		renderSkills(candidato.skills);
		
	} catch (e) {
		console.error('Erro ao carregar candidato:', e);
		mostrarErro('Erro ao carregar dados do candidato.');
	}
}

// Aguarda o DOM estar pronto
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', carregarCandidato);
} else {
	carregarCandidato();
}

function preencherCamposBasicos(candidato) {
	setText('#candidateName', candidato.name || candidato.nameCandidate);
	setText('#candidateEmail', candidato.email || candidato.emailCandidate);
	setText('#candidatePhone', candidato.phoneNumber || candidato.phone || '');
	setText('#candidateState', candidato.state || '');
	
	// Formata data de nascimento
	if (candidato.birth) {
		const birthDate = new Date(candidato.birth);
		const formattedDate = birthDate.toLocaleDateString('pt-BR');
		setText('#candidateBirth', formattedDate);
	} else {
		setText('#candidateBirth', '');
	}
}

function preencherDetalhes(detalhes) {
	// Se os detalhes tiverem informações adicionais, preenche aqui
	if (detalhes.education) {
		renderEducation(detalhes.education);
	}
	if (detalhes.skills) {
		renderSkills(detalhes.skills);
	}
}

function setText(selector, value) {
	const el = document.querySelector(selector);
	if (el) el.textContent = value || '';
}

function renderEducation(education) {
	const container = document.querySelector('#education-content');
	if (!container) return;
	
	container.innerHTML = '';
	
	if (!education || education.trim() === '') {
		container.innerHTML = '<div class="text-muted text-center py-3">Nenhuma escolaridade informada.</div>';
		return;
	}
	
	// Se education for uma string, tenta formatar
	if (typeof education === 'string') {
		// Se for JSON string, tenta parsear
		try {
			const educations = JSON.parse(education);
			if (Array.isArray(educations)) {
				educations.forEach(edu => {
					container.appendChild(createEducationItem(edu));
				});
			} else {
				container.appendChild(createEducationItem(educations));
			}
		} catch (e) {
			// Se não for JSON, trata como texto simples
			const item = document.createElement('div');
			item.className = 'education-item';
			item.innerHTML = `<p>${escapeHtml(education)}</p>`;
			container.appendChild(item);
		}
	} else if (Array.isArray(education)) {
		education.forEach(edu => {
			container.appendChild(createEducationItem(edu));
		});
	} else {
		container.appendChild(createEducationItem(education));
	}
}

function createEducationItem(edu) {
	const item = document.createElement('div');
	item.className = 'education-item';
	
	if (typeof edu === 'string') {
		item.innerHTML = `<p>${escapeHtml(edu)}</p>`;
	} else {
		const title = edu.title || edu.course || edu.degree || 'Formação';
		const institution = edu.institution || edu.school || '';
		const period = edu.period || (edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : '') || '';
		const status = edu.status || edu.completed ? 'Concluído' : 'Em andamento';
		
		item.innerHTML = `
			<h6>${escapeHtml(title)}</h6>
			${institution ? `<p><strong>Instituição:</strong> ${escapeHtml(institution)}</p>` : ''}
			${period ? `<p><strong>Período:</strong> ${escapeHtml(period)}</p>` : ''}
			<p><strong>Status:</strong> ${escapeHtml(status)}</p>
		`;
	}
	
	return item;
}

function renderSkills(skills) {
	const container = document.querySelector('#skills-content');
	if (!container) return;
	
	container.innerHTML = '';
	
	if (!skills || (typeof skills === 'string' && skills.trim() === '')) {
		container.innerHTML = '<div class="text-muted text-center py-3">Nenhuma competência informada.</div>';
		return;
	}
	
	// Se skills for uma string, separa por vírgula
	if (typeof skills === 'string') {
		skills.split(',').forEach(skill => {
			const trimmed = skill.trim();
			if (trimmed) {
				const tag = document.createElement('div');
				tag.className = 'skill-tag';
				tag.textContent = trimmed;
				container.appendChild(tag);
			}
		});
	} else if (Array.isArray(skills)) {
		skills.forEach(skill => {
			const tag = document.createElement('div');
			tag.className = 'skill-tag';
			tag.textContent = typeof skill === 'string' ? skill : (skill.name || skill);
			container.appendChild(tag);
		});
	}
	
	// Se não houver skills adicionadas, mostra mensagem
	if (container.children.length === 0) {
		container.innerHTML = '<div class="text-muted text-center py-3">Nenhuma competência informada.</div>';
	}
}

function renderExperience(experience) {
	const container = document.querySelector('#experience-content');
	if (!container) return;
	
	container.innerHTML = '';
	
	if (!experience || (typeof experience === 'string' && experience.trim() === '')) {
		container.innerHTML = '<div class="text-muted text-center py-3">Nenhuma experiência informada.</div>';
		return;
	}
	
	// Se experience for uma string (texto), exibe como texto formatado
	if (typeof experience === 'string') {
		// Tenta parsear como JSON
		try {
			const experiences = JSON.parse(experience);
			if (Array.isArray(experiences)) {
				experiences.forEach(exp => {
					container.appendChild(createExperienceItem(exp));
				});
			} else {
				container.appendChild(createExperienceItem(experiences));
			}
		} catch (e) {
			// Se não for JSON, exibe como texto simples formatado
			const lines = experience.split('\n').filter(line => line.trim());
			if (lines.length > 0) {
				const item = document.createElement('div');
				item.className = 'experience-item';
				item.innerHTML = `<p>${lines.map(line => escapeHtml(line)).join('<br>')}</p>`;
				container.appendChild(item);
			} else {
				const item = document.createElement('div');
				item.className = 'experience-item';
				item.innerHTML = `<p>${escapeHtml(experience)}</p>`;
				container.appendChild(item);
			}
		}
	} else if (Array.isArray(experience)) {
		experience.forEach(exp => {
			container.appendChild(createExperienceItem(exp));
		});
	} else {
		container.appendChild(createExperienceItem(experience));
	}
	
	// Se não houver experiência adicionada, mostra mensagem
	if (container.children.length === 0) {
		container.innerHTML = '<div class="text-muted text-center py-3">Nenhuma experiência informada.</div>';
	}
}

function createExperienceItem(exp) {
	const item = document.createElement('div');
	item.className = 'experience-item';
	
	if (typeof exp === 'string') {
		item.innerHTML = `<p>${escapeHtml(exp)}</p>`;
	} else {
		const title = exp.title || exp.position || exp.jobTitle || 'Experiência';
		const company = exp.company || exp.employer || '';
		const period = exp.period || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '') || '';
		const description = exp.description || exp.responsibilities || '';
		
		item.innerHTML = `
			<h6>${escapeHtml(title)}</h6>
			${company ? `<p><strong>Empresa:</strong> ${escapeHtml(company)}</p>` : ''}
			${period ? `<p><strong>Período:</strong> ${escapeHtml(period)}</p>` : ''}
			${description ? `<p><strong>Descrição:</strong> ${escapeHtml(description)}</p>` : ''}
		`;
	}
	
	return item;
}

function escapeHtml(text) {
	if (!text) return '';
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
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

// Função para criar o gráfico de progresso
function criarGraficoProgresso(porcentagem = 45) {
	const ctx = document.getElementById('progressChart');
	if (!ctx) return;
	
	// Atualiza a porcentagem exibida
	const progressPercentage = document.getElementById('progressPercentage');
	if (progressPercentage) {
		progressPercentage.textContent = porcentagem + '%';
	}
	
	// Destrói gráfico anterior se existir
	if (window.progressChartInstance) {
		window.progressChartInstance.destroy();
	}
	
	// Cria novo gráfico
	window.progressChartInstance = new Chart(ctx, {
		type: 'doughnut',
		data: {
			datasets: [{
				data: [porcentagem, 100 - porcentagem],
				backgroundColor: [
					'#7c3aed',
					'#e5e7eb'
				],
				borderWidth: 0,
				cutout: '75%'
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			plugins: {
				legend: {
					display: false
				},
				tooltip: {
					enabled: false
				}
			},
			animation: {
				animateRotate: true,
				duration: 1500
			}
		}
	});
}

// Função para download do currículo
window.downloadResume = function() {
	const candidateId = localStorage.getItem('selectedCandidateId');
	if (!candidateId) {
		alert('Erro: Candidato não identificado.');
		return;
	}
	
	// Aqui você pode implementar a lógica de download
	// Por exemplo, fazer uma requisição para o backend
	alert('Funcionalidade de download será implementada em breve.');
	console.log('Download do currículo do candidato:', candidateId);
};

// Função para excluir candidato
window.excludeCandidate = function() {
	const candidateId = localStorage.getItem('selectedCandidateId');
	if (!candidateId) {
		alert('Erro: Candidato não identificado.');
		return;
	}
	
	if (confirm('Tem certeza que deseja excluir este candidato? Esta ação não pode ser desfeita.')) {
		// Aqui você pode implementar a lógica de exclusão
		// Por exemplo, fazer uma requisição para o backend
		alert('Funcionalidade de exclusão será implementada em breve.');
		console.log('Excluir candidato:', candidateId);
	}
};

// Inicializa o gráfico quando a página carregar
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		setTimeout(() => criarGraficoProgresso(45), 500);
	});
} else {
	setTimeout(() => criarGraficoProgresso(45), 500);
}
