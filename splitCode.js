const fs = require('fs');
const acorn = require('acorn');

const code = fs.readFileSync('Code.js', 'utf8');

const targets = {
    'Config.js': ['getConfigValue', 'getSpreadsheetAccountId', 'getBukuIndukSpreadsheetId', 'getStudentPdfFolderId'],
    'Utils.js': ['bytesToHex', 'safeCompare', 'findColumnIndex', 'formatDate', 'formatDateForInput', 'parseDate', 'formatDateForSerialization', 'ensureUserColumns'],
    'DashboardService.js': ['getDashboardData', 'calculateSummaryStats', 'calculateOverallAverageGrade', 'getRecentStudents'],
    'StudentService.js': ['getAllStudents', 'getStudentDetail', 'findStudentByNIS', 'getStudentById', 'updateStudentData', 'deleteStudent', 'getStudentPDFUrl', 'initializeColumnMap', 'updateStudent', 'getStudentStatistics', 'getStudentColumnMap', 'getStudentData', 'getStudentDataByNim', 'addStudent', 'createStudentsSheet', 'previewStudentsByEntryDate', 'batchUpdateStudentStatus'],
    'GradesService.js': ['getAllStudentGrades', 'getAllStudentGradesForFrontend', 'getStudentGradesByNIS', 'generateGradeSummary', 'initializeGradeColumnMap', 'getAvailableSubjects', 'getAvailableClasses', 'getStudentDetailForGrades', 'getAllStudentGradesForDetail', 'getStudentGradeDetail', 'updateStudentGrades'],
    'KipService.js': ['getKIPDashboardStats', 'getKIPAnalysisResults', 'ensureKIPAnalysisSheet', 'hasKIPAnalysisData', 'startKIPAnalysis', 'analyzeStudentKIP', 'calculateIncomeScore', 'getIncomeScore', 'calculateFamilyStatusScore', 'calculateDependentsScore', 'calculateScholarshipScore', 'exportKIPAnalysis']
};

let comments = [];
const ast = acorn.parse(code, {
    ecmaVersion: 2020,
    locations: true,
    onComment: comments
});

const extracted = {};
for (const file of Object.keys(targets)) {
    extracted[file] = [];
}

let remainingCodeBlocks = [];
let lastEnd = 0;

function getLeadingComments(nodeStart) {
    // Find comments that end before the node starts and have no other nodes in between
    const relevantComments = comments.filter(c => c.end <= nodeStart && c.start >= lastEnd);
    if (relevantComments.length === 0) return '';
    return relevantComments.map(c => {
        const text = code.substring(c.start, c.end);
        return text;
    }).join('\n') + '\n';
}

const blocksToRemove = [];

for (const node of ast.body) {
    if (node.type === 'FunctionDeclaration' && node.id) {
        const funcName = node.id.name;
        
        let targetFile = null;
        for (const [file, funcs] of Object.entries(targets)) {
            if (funcs.includes(funcName)) {
                targetFile = file;
                break;
            }
        }
        
        if (targetFile) {
            // Find comments associated with this function
            let blockStart = node.start;
            const relevantComments = comments.filter(c => c.end <= node.start && c.start >= lastEnd);
            if (relevantComments.length > 0) {
                blockStart = relevantComments[0].start;
            }
            
            const funcCode = code.substring(blockStart, node.end);
            extracted[targetFile].push(funcCode);
            blocksToRemove.push({start: blockStart, end: node.end});
        }
    }
    // Update lastEnd based on the current node to correctly attach comments to next nodes
    lastEnd = node.end;
}

// Rebuild Code.js
let newCode = '';
let currentPos = 0;
for (const block of blocksToRemove) {
    newCode += code.substring(currentPos, block.start);
    currentPos = block.end;
}
newCode += code.substring(currentPos);

// Clean up extra newlines in Code.js
newCode = newCode.replace(/\n\s*\n/g, '\n\n');

fs.writeFileSync('Code.js', newCode);

// Write target files
for (const [file, blocks] of Object.entries(extracted)) {
    if (blocks.length > 0) {
        fs.writeFileSync(file, blocks.join('\n\n') + '\n');
        console.log(`Wrote ${blocks.length} functions to ${file}`);
    }
}

console.log('Code.js updated successfully!');
