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
import { CandidateClient, SelectionProcessClient } from '../../../client/client.js';

async function carregarCandidato() {
	// Tenta obter o ID da URL primeiro, depois do localStorage
	const urlParams = new URLSearchParams(window.location.search);
	let candidateId = urlParams.get('id') || localStorage.getItem('selectedCandidateId');
	
	if (!candidateId) {
		mostrarErro('Nenhum candidato selecionado.');
		return;
	}
	
	// Garante que está salvo no localStorage para compatibilidade
	localStorage.setItem('selectedCandidateId', String(candidateId));
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
		
		// Busca processo seletivo do candidato
		await carregarProcessoSeletivo(candidateId);
		
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
function criarGraficoProgresso(porcentagem = 0) {
	console.log(`🎨 criarGraficoProgresso chamado com ${porcentagem}%`);
	
	const ctx = document.getElementById('progressChart');
	if (!ctx) {
		console.error('❌ Elemento progressChart não encontrado!');
		return;
	}
	
	// Atualiza a porcentagem exibida usando a função dedicada
	atualizarPorcentagemNoDOM(porcentagem);
	
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
	const urlParams = new URLSearchParams(window.location.search);
	const candidateId = urlParams.get('id') || localStorage.getItem('selectedCandidateId');
	
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
window.excludeCandidate = async function() {
    const client = new CandidateClient();
    const urlParams = new URLSearchParams(window.location.search);
    const candidateId = urlParams.get('id') || localStorage.getItem('selectedCandidateId');

    if (!candidateId) {
        alert('Erro: Candidato não identificado.');
        return;
    }

    const confirmDelete = confirm(
        'Tem certeza que deseja excluir este candidato? Esta ação não pode ser desfeita.'
    );

    if (!confirmDelete) return;

    try {
        const deleted = await client.deleteCandidate(candidateId);

        alert('Candidato excluído com sucesso!');
        console.log('Candidato excluído:', deleted);

        window.location.href = "candidatos.html";

    } catch (error) {
        console.error('Erro ao excluir candidato:', error);
        alert('Erro ao excluir candidato.');
    }
};

/**
 * Atualiza o valor da porcentagem no elemento HTML
 * @param {number} progress - Porcentagem (0-100)
 */
function atualizarPorcentagemNoDOM(progress) {
	const progressPercentage = document.getElementById('progressPercentage');
	if (progressPercentage) {
		progressPercentage.textContent = progress + '%';
		console.log(`✅ Porcentagem atualizada no DOM: ${progress}%`);
		return true;
	} else {
		console.error('❌ Elemento progressPercentage não encontrado no DOM!');
		// Tenta novamente após um pequeno delay
		setTimeout(() => {
			const retry = document.getElementById('progressPercentage');
			if (retry) {
				retry.textContent = progress + '%';
				console.log(`✅ Porcentagem atualizada no DOM (retry): ${progress}%`);
			}
		}, 100);
		return false;
	}
}

/**
 * Mapeia KanbanCardDTO do backend para formato do frontend (igual ao kanban)
 * @param {Object} card - KanbanCardDTO do backend
 */
function mapKanbanCardToProcess(card) {
	// O backend pode retornar currentStage diretamente ou stage.name
	let stage = card.currentStage || 
	            card.stage?.name || 
	            card.stageName || 
	            card.stage || 
	            'aguardando_triagem';
	
	// Normaliza o nome do stage
	stage = String(stage).toLowerCase().trim();
	
	// Mapeia para o nome esperado pelo frontend se necessário
	const STAGE_MAPPING = {
		"triagem": "triagem",
		"entrevista_rh": "entrevista_rh",
		"aguardando_triagem": "aguardando_triagem",
		"avaliacao_fit_cultural": "avaliacao_fit_cultural",
		"teste_tecnico": "teste_tecnico",
		"entrevista_tecnica": "entrevista_tecnica",
		"entrevista_final": "entrevista_final",
		"proposta_fechamento": "proposta_fechamento",
		"contratacao": "contratacao"
	};
	
	const mappedStage = STAGE_MAPPING[stage] || stage;
	
	const mapped = {
		id: card.processId || card.id || card.cardId,
		processId: card.processId || card.id || card.cardId,
		candidateId: card.candidateId,
		candidateName: card.candidateName,
		vacancyTitle: card.vacancyTitle,
		vacancyId: card.vacancyId,
		workModel: card.workModel,
		contractType: card.contractType,
		managerName: card.managerName,
		currentStage: mappedStage,
		progress: card.progress || calculateProgress(mappedStage)
	};
	
	return mapped;
}

/**
 * Calcula progresso baseado na etapa do processo
 * @param {string} stage - Etapa atual
 * @returns {number} Porcentagem de progresso (0-100)
 */
function calculateProgress(stage) {
	const stageProgress = {
		'aguardando_triagem': 0,
		'triagem': 12.5,
		'triagem_inicial': 12.5,
		'entrevista_rh': 25.0,
		'avaliacao_fit_cultural': 37.5,
		'teste_tecnico': 50.0,
		'entrevista_tecnica': 62.5,
		'entrevista_final': 75.0,
		'proposta_fechamento': 87.5,
		'contratacao': 100.0
	};
	
	const normalizedStage = String(stage || '').toLowerCase().trim();
	const progress = stageProgress[normalizedStage] || 0;
	console.log(`🔢 calculateProgress: stage="${normalizedStage}" -> ${progress}%`);
	return progress;
}

/**
 * Carrega processo seletivo do candidato
 * @param {string|number} candidateId - ID do candidato
 */
async function carregarProcessoSeletivo(candidateId) {
	try {
		const selectionClient = new SelectionProcessClient();
		
		// Busca todos os processos do kanban e filtra pelo candidato
		const allProcesses = await selectionClient.findAllKanban();
		console.log('📊 Todos os processos do kanban:', allProcesses);
		console.log('🔍 Buscando processo para candidato ID:', candidateId);
		
		// Converte candidateId para número para comparação
		const candidateIdNum = Number(candidateId);
		const candidateIdStr = String(candidateId);
		
		console.log(`🔍 Buscando processo para candidato ID (num: ${candidateIdNum}, str: ${candidateIdStr})`);
		
		// Encontra o processo deste candidato (tenta diferentes campos e formatos)
		const candidateProcess = allProcesses.find(p => {
			// Tenta diferentes campos onde o candidateId pode estar
			const pCandidateId = p.candidateId || 
			                    p.candidate?.id || 
			                    p.candidate?.id_candidate || 
			                    p.candidate?.idCandidate ||
			                    p.fk_candidate || 
			                    p.fkCandidate;
			
			// Tenta diferentes comparações
			const match = pCandidateId == candidateId || 
			             pCandidateId === candidateIdNum ||
			             pCandidateId === candidateIdStr ||
			             String(pCandidateId) === candidateIdStr ||
			             Number(pCandidateId) === candidateIdNum;
			
			if (match) {
				console.log('✅ Match encontrado! Processo:', p);
				console.log('📋 CandidateId do processo:', pCandidateId, 'Tipo:', typeof pCandidateId);
			}
			return match;
		});
		
		if (candidateProcess) {
			console.log('✅ Processo seletivo encontrado (RAW):', JSON.stringify(candidateProcess, null, 2));
			
			// Mapeia o card do backend (igual ao kanban)
			const mappedProcess = mapKanbanCardToProcess(candidateProcess);
			console.log('✅ Processo mapeado:', mappedProcess);
			
			// Extrai dados do processo mapeado
			let currentStage = mappedProcess.currentStage || 
			                  candidateProcess.currentStage || 
			                  candidateProcess.stage?.name || 
			                  candidateProcess.stageName || 
			                  candidateProcess.stage || 
			                  'aguardando_triagem';
			
			// Normaliza o stage
			currentStage = String(currentStage).toLowerCase().trim();
			
			// SEMPRE calcula o progresso baseado na etapa (garantia)
			// Tenta usar o progress do backend primeiro, mas se não tiver, calcula
			let progress = mappedProcess.progress || candidateProcess.progress;
			
			// Converte para número se necessário
			if (typeof progress === 'string') {
				progress = parseFloat(progress);
			}
			
			// Se não tem progresso válido, calcula baseado na etapa
			if (!progress || progress === 0 || isNaN(progress) || progress < 0) {
				progress = calculateProgress(currentStage);
				console.log(`📈 Progresso calculado baseado na etapa "${currentStage}": ${progress}%`);
			} else {
				console.log(`📈 Progresso do backend: ${progress}%`);
			}
			
			// Garante que progress está entre 0 e 100
			progress = Math.max(0, Math.min(100, Number(progress) || 0));
			
			const vacancyTitle = mappedProcess.vacancyTitle || 
			                    candidateProcess.vacancyTitle ||
			                    candidateProcess.vacancy?.position_job || 
			                    candidateProcess.vacancy?.positionJob ||
			                    'Vaga não especificada';
			
			const progressFinal = Math.round(progress);
			console.log(`✅ Dados finais - Progresso: ${progressFinal}%, Etapa: "${currentStage}", Vaga: "${vacancyTitle}"`);
			console.log(`✅ Atualizando gráfico com ${progressFinal}% e etapa "${currentStage}"`);
			
			// Atualiza a porcentagem no DOM IMEDIATAMENTE
			atualizarPorcentagemNoDOM(progressFinal);
			
			// Atualiza o gráfico com a porcentagem real
			criarGraficoProgresso(progressFinal);
			
			// Atualiza informações do processo seletivo
			atualizarInfoProcessoSeletivo({
				progress: progressFinal,
				currentStage: currentStage,
				vacancyTitle: vacancyTitle
			});
		} else {
			console.log('⚠️ Nenhum processo seletivo encontrado para este candidato');
			console.log('📋 Total de processos retornados:', allProcesses.length);
			console.log('📋 IDs de candidatos nos processos:', allProcesses.map(p => ({
				candidateId: p.candidateId,
				candidate: p.candidate,
				fk_candidate: p.fk_candidate,
				processId: p.processId || p.id
			})));
			
			// Se não encontrou processo, mostra 0% mas ainda atualiza a interface
			const defaultProgress = 0;
			console.log(`⚠️ Usando progresso padrão: ${defaultProgress}%`);
			
			// Atualiza a porcentagem no DOM IMEDIATAMENTE
			atualizarPorcentagemNoDOM(defaultProgress);
			
			criarGraficoProgresso(defaultProgress);
			atualizarInfoProcessoSeletivo({
				progress: defaultProgress,
				currentStage: null,
				vacancyTitle: null
			});
		}
	} catch (error) {
		console.error('❌ Erro ao carregar processo seletivo:', error);
		console.error('Stack trace:', error.stack);
		
		// Em caso de erro, mostra 0% mas garante que a interface seja atualizada
		const errorProgress = 0;
		console.log(`❌ Erro - Usando progresso padrão: ${errorProgress}%`);
		
		// Atualiza a porcentagem no DOM IMEDIATAMENTE
		atualizarPorcentagemNoDOM(errorProgress);
		
		criarGraficoProgresso(errorProgress);
		atualizarInfoProcessoSeletivo({
			progress: errorProgress,
			currentStage: null,
			vacancyTitle: null
		});
	}
}

/**
 * Atualiza informações do processo seletivo na interface
 * @param {Object} info - Informações do processo
 */
function atualizarInfoProcessoSeletivo(info) {
	console.log(`🔄 atualizarInfoProcessoSeletivo chamado com:`, info);
	
	// Atualiza a porcentagem (garante que está atualizada)
	atualizarPorcentagemNoDOM(info.progress);
	
	// Atualiza timeline do processo seletivo
	atualizarTimelineProcesso(info.currentStage);
	
	// Adiciona informações adicionais se necessário
	if (info.currentStage && info.vacancyTitle) {
		let stageInfo = document.getElementById('currentStageInfo');
		if (!stageInfo) {
			stageInfo = document.createElement('div');
			stageInfo.id = 'currentStageInfo';
			stageInfo.className = 'text-center mt-3';
			stageInfo.style.cssText = 'color: #6c757d; font-size: 13px; padding-top: 15px; border-top: 1px solid #e5e7eb;';
			const progressInfo = document.querySelector('.progress-info');
			if (progressInfo) {
				progressInfo.appendChild(stageInfo);
			}
		}
		
		const stageNames = {
			'aguardando_triagem': 'Aguardando Triagem',
			'triagem': 'Triagem',
			'triagem_inicial': 'Triagem Inicial',
			'entrevista_rh': 'Entrevista RH',
			'avaliacao_fit_cultural': 'Fit Cultural',
			'teste_tecnico': 'Teste Técnico',
			'entrevista_tecnica': 'Entrevista Técnica',
			'entrevista_final': 'Entrevista Final',
			'proposta_fechamento': 'Proposta',
			'contratacao': 'Contratação'
		};
		
		const stageName = stageNames[info.currentStage] || info.currentStage;
		
		stageInfo.innerHTML = `
			<p class="mb-1" style="font-weight: 600; color: #2c3e50;">Vaga em Processo:</p>
			<p class="mb-0" style="color: #7c3aed; font-weight: 500;">${escapeHtml(info.vacancyTitle)}</p>
		`;
	}
}

/**
 * Atualiza a timeline do processo seletivo
 * @param {string} currentStage - Etapa atual do processo
 */
function atualizarTimelineProcesso(currentStage) {
	if (!currentStage) {
		// Se não há etapa, remove todas as marcações
		document.querySelectorAll('.timeline-item').forEach(item => {
			item.classList.remove('completed', 'current');
		});
		return;
	}
	
	// Ordem das etapas
	const stageOrder = [
		'aguardando_triagem',
		'triagem',
		'entrevista_rh',
		'avaliacao_fit_cultural',
		'teste_tecnico',
		'entrevista_tecnica',
		'entrevista_final',
		'proposta_fechamento',
		'contratacao'
	];
	
	const currentIndex = stageOrder.indexOf(currentStage);
	
	// Atualiza cada item da timeline
	document.querySelectorAll('.timeline-item').forEach(item => {
		const itemStage = item.dataset.stage;
		const itemIndex = stageOrder.indexOf(itemStage);
		
		// Remove classes anteriores
		item.classList.remove('completed', 'current');
		
		// Se a etapa já foi completada
		if (itemIndex >= 0 && itemIndex < currentIndex) {
			item.classList.add('completed');
		}
		// Se é a etapa atual
		else if (itemIndex === currentIndex) {
			item.classList.add('current');
		}
	});
}

// Inicializa o gráfico quando a página carregar (será atualizado quando os dados chegarem)
// Aguarda um pouco mais para garantir que o DOM está pronto
function inicializarGraficoProgresso() {
	const initProgress = 0;
	console.log('🎨 Inicializando gráfico com 0% (aguardando dados)');
	
	// Atualiza a porcentagem no DOM IMEDIATAMENTE
	atualizarPorcentagemNoDOM(initProgress);
	
	// Cria o gráfico
	criarGraficoProgresso(initProgress);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		setTimeout(inicializarGraficoProgresso, 500);
	});
} else {
	setTimeout(inicializarGraficoProgresso, 500);
}
