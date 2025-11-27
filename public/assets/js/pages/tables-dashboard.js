/* ========================================
   DASHBOARD DE TABELAS
   Inicialização e funcionalidades das tabelas
   ======================================== */

$(document).ready(function() {
    // Configuração padrão do DataTables
    var defaultOptions = {
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/pt-BR.json',
            search: "Buscar:",
            lengthMenu: "Mostrar _MENU_ registros por página",
            info: "Mostrando _START_ até _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 até 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros no total)",
            paginate: {
                first: "Primeiro",
                last: "Último",
                next: "Próximo",
                previous: "Anterior"
            }
        },
        pageLength: 10,
        order: [[5, 'desc']], // Ordenar por data (última coluna)
        responsive: true
    };

    // Inicializar Tabela de Vagas
    var vagasTable = $('#vagasTable').DataTable({
        ...defaultOptions,
        order: [[5, 'desc']], // Ordenar por data de abertura
        columnDefs: [
            { orderable: false, targets: [7] } // Coluna de ações não ordenável
        ]
    });

    // Filtro de status para tabela de vagas
    $('#statusFilter').on('change', function() {
        var status = $(this).val();
        if (status === '') {
            vagasTable.column(4).search('').draw();
        } else {
            vagasTable.column(4).search('^' + status + '$', true, false).draw();
        }
    });

    // Inicializar Tabela de Candidatos
    var candidatosTable = $('#candidatosTable').DataTable({
        ...defaultOptions,
        order: [[5, 'desc']], // Ordenar por data de candidatura
        columnDefs: [
            { orderable: false, targets: [7] } // Coluna de ações não ordenável
        ]
    });

    // Busca personalizada para tabela de candidatos
    $('#candidatoSearch').on('keyup', function() {
        candidatosTable.search($(this).val()).draw();
    });

    // Inicializar Tabela de Contratações
    var contratacoesTable = $('#contratacoesTable').DataTable({
        ...defaultOptions,
        order: [[4, 'desc']], // Ordenar por data de contratação
        columnDefs: [
            { orderable: false, targets: [] } // Todas as colunas ordenáveis
        ]
    });

    // Adicionar classes de estilo aos badges
    $('.badge').each(function() {
        var badge = $(this);
        var text = badge.text().toLowerCase();
        
        // Remover classes existentes de badge
        badge.removeClass('badge-primary badge-success badge-warning badge-danger badge-info');
        
        // Adicionar classes baseadas no conteúdo
        if (text.includes('aprovad') || text.includes('ativo') || text.match(/\d+%/)) {
            if (parseInt(text) >= 70 || text.includes('aprovad') || text.includes('ativo')) {
                badge.addClass('badge-success');
            } else if (parseInt(text) >= 50) {
                badge.addClass('badge-warning');
            } else {
                badge.addClass('badge-danger');
            }
        } else if (text.includes('abert') || text.includes('pj')) {
            badge.addClass('badge-primary');
        } else if (text.includes('análise') || text.includes('aguardando') || text.includes('clt')) {
            badge.addClass('badge-info');
        } else if (text.includes('rejeitad')) {
            badge.addClass('badge-danger');
        } else if (text.includes('estágio')) {
            badge.addClass('badge-warning');
        }
    });
});

// Função para exportar tabela (pode ser expandida para CSV/Excel)
function exportTable() {
    // Implementar lógica de exportação
    alert('Funcionalidade de exportação será implementada em breve!');
    
    // Exemplo de exportação CSV simples:
    // var csv = [];
    // $('#vagasTable tr').each(function() {
    //     var row = [];
    //     $(this).find('td, th').each(function() {
    //         row.push($(this).text().trim());
    //     });
    //     csv.push(row.join(','));
    // });
    // var csvContent = csv.join('\n');
    // var blob = new Blob([csvContent], { type: 'text/csv' });
    // var url = window.URL.createObjectURL(blob);
    // var a = document.createElement('a');
    // a.href = url;
    // a.download = 'vagas.csv';
    // a.click();
}

// Função para atualizar dados das tabelas (pode ser chamada via API)
function refreshTables() {
    $('#vagasTable').DataTable().ajax.reload();
    $('#candidatosTable').DataTable().ajax.reload();
    $('#contratacoesTable').DataTable().ajax.reload();
}

// Adicionar tooltips aos botões
$(document).ready(function() {
    $('[data-toggle="tooltip"]').tooltip();
    
    // Adicionar tooltips aos botões de ação
    $('.btn-sm').each(function() {
        var btn = $(this);
        var icon = btn.find('i');
        
        if (icon.hasClass('fa-eye')) {
            btn.attr('title', 'Visualizar detalhes');
        } else if (icon.hasClass('fa-edit')) {
            btn.attr('title', 'Editar');
        } else if (icon.hasClass('fa-check')) {
            btn.attr('title', 'Aprovar candidato');
        }
        
        btn.attr('data-toggle', 'tooltip');
    });
    
    // Reinicializar tooltips após adicionar atributos
    $('[data-toggle="tooltip"]').tooltip();
});

