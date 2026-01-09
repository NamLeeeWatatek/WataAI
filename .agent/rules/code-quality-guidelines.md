---
trigger: always_on
version: 2.0.2026
last_updated: 2026-01-08
category: development-process
related_rules:
  - code-review-process
  - rule-governance
---

## Code Quality & Stability Guidelines

### Core Principles
- Prioritize correctness, security, and maintainability
- Make data-driven decisions based on metrics and evidence
- Balance stability with continuous improvement

### Code Modification Guidelines
- **Stable Code**: Working code that meets standards should not be changed without justification
- **Improvement Criteria**: Changes must be based on:
  - Measurable performance improvements
  - Security vulnerabilities
  - Bug fixes with clear reproduction steps
  - Business requirements with documented rationale

### Decision Framework
1. **Assess Impact**: Evaluate risk vs benefit of proposed changes
2. **Gather Evidence**: Use profiling, metrics, and testing data
3. **Consider Alternatives**: Explore multiple solutions
4. **Document Rationale**: Clear justification for changes

### Modern Practices (2026)
- **Observability-Driven Development**: Use metrics to guide improvements
- **Progressive Enhancement**: Implement changes incrementally
- **Automated Safety Nets**: Comprehensive test coverage and CI/CD pipelines
- **Architecture Decision Records**: Document significant changes
- **Technical Debt Management**: Track and prioritize debt systematically

### When to Refactor
- **Green Light**: Clear metrics showing improvement needed
- **Yellow Light**: Discuss with team for significant architectural changes
- **Red Light**: Avoid changes to stable systems without compelling evidence

### Code Review Focus Areas
- Security vulnerabilities and compliance
- Performance bottlenecks with measurable impact
- Maintainability and readability improvements
- Test coverage and reliability enhancements

### Rule Metadata

**Version**: 2.0.2026
**Status**: Active
**Last Reviewed**: 2026-01-08
**Applies To**: All code modification and review activities
**Priority**: High
**Related Rules**:
- [Code Review Process](code-review-process.md)
- [Rule Governance](rule-governance.md)

### Common Pitfalls
- Making changes without clear justification
- Ignoring existing metrics and data
- Failing to document rationale for changes
- Over-optimizing without measurable benefits
- Underestimating risk of changes

### When to Use
- Code modification decisions
- Refactoring considerations
- Performance optimization
- Security improvements
- Architectural changes

### When Not to Use
- Emergency bug fixes
- Experimental features
- Prototyping and spikes
- When explicit override is requested

### Quality Decision Matrix

| Change Type | Risk Level | Required Justification | Approval Needed |
|-------------|------------|------------------------|-----------------|
| Bug Fix | Low | Clear reproduction steps | Individual |
| Security Patch | Low | Vulnerability reference | Individual |
| Performance | Medium | Benchmark data | Team review |
| Refactoring | Medium | Code quality metrics | Team review |
| Architecture | High | Comprehensive analysis | Architecture review |

### Continuous Improvement Process
1. **Identify**: Find improvement opportunities
2. **Analyze**: Gather data and metrics
3. **Propose**: Develop solution with rationale
4. **Review**: Team evaluation and feedback
5. **Implement**: Make changes with safety nets
6. **Monitor**: Track impact and effectiveness
7. **Iterate**: Refine based on results
