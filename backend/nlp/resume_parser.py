# Resume PDF parser — PyMuPDF text extraction + skill taxonomy matching
import logging
import re
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


class ResumeParser:
    """Extract structured data from resume PDF files."""

    async def parse_pdf(self, pdf_path: str) -> dict:
        """
        Extract text from PDF and parse into structured sections.
        Returns dict with raw_text, sections, skills, education, experience.
        """
        try:
            doc = fitz.open(pdf_path)
            pages_text = []
            for page in doc:
                pages_text.append(page.get_text())
            doc.close()

            raw_text = "\n".join(pages_text)
            if not raw_text.strip():
                return {"error": "Empty PDF — no text extracted", "raw_text": ""}

            sections = self._extract_sections(raw_text)

            return {
                "raw_text": raw_text,
                "sections": sections,
                "education": self._extract_education(sections.get("education", "")),
                "experience": self._extract_experience(sections.get("experience", "")),
                "projects": self._extract_projects(sections.get("projects", "")),
                "certifications": self._extract_certifications(sections.get("certifications", "")),
                "contact": self._extract_contact(raw_text),
            }
        except Exception as e:
            logger.error(f"Resume parse error: {e}")
            return {"error": str(e), "raw_text": ""}

    async def parse_pdf_bytes(self, pdf_bytes: bytes) -> dict:
        """Parse PDF from bytes (for uploaded files)."""
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            pages_text = []
            for page in doc:
                pages_text.append(page.get_text())
            doc.close()

            raw_text = "\n".join(pages_text)
            if not raw_text.strip():
                return {"error": "Empty PDF — no text extracted", "raw_text": ""}

            sections = self._extract_sections(raw_text)

            return {
                "raw_text": raw_text,
                "sections": sections,
                "education": self._extract_education(sections.get("education", "")),
                "experience": self._extract_experience(sections.get("experience", "")),
                "projects": self._extract_projects(sections.get("projects", "")),
                "certifications": self._extract_certifications(sections.get("certifications", "")),
                "contact": self._extract_contact(raw_text),
            }
        except Exception as e:
            logger.error(f"Resume parse error: {e}")
            return {"error": str(e), "raw_text": ""}

    def _extract_sections(self, text: str) -> dict:
        """Split resume text into named sections."""
        section_headers = [
            "education", "experience", "work experience", "professional experience",
            "projects", "technical projects", "personal projects",
            "skills", "technical skills", "technologies",
            "certifications", "certificates", "awards",
            "achievements", "summary", "objective",
            "internships", "internship experience",
        ]

        sections = {}
        lines = text.split("\n")
        current_section = "header"
        current_content = []

        for line in lines:
            line_stripped = line.strip()
            line_lower = line_stripped.lower()

            # Check if this line is a section header
            matched_section = None
            for header in section_headers:
                if line_lower == header or line_lower.startswith(header + ":") or line_lower.startswith(header + " "):
                    matched_section = header.split()[0]  # Use first word as key
                    break

            if matched_section:
                # Save previous section
                if current_content:
                    sections[current_section] = "\n".join(current_content).strip()
                current_section = matched_section
                current_content = []
            else:
                current_content.append(line)

        # Save last section
        if current_content:
            sections[current_section] = "\n".join(current_content).strip()

        return sections

    def _extract_education(self, text: str) -> list[dict]:
        """Extract education entries."""
        entries = []
        if not text:
            return entries

        # Look for CGPA/GPA patterns
        cgpa_pattern = re.compile(r'(?:CGPA|GPA|CPI)[:\s]*(\d+\.?\d*)\s*/?\s*(\d+\.?\d*)?', re.IGNORECASE)
        # Look for degree patterns
        degree_pattern = re.compile(r'(B\.?Tech|B\.?E\.?|M\.?Tech|M\.?S\.?|B\.?Sc|M\.?Sc|MBA|PhD|B\.?C\.?A|M\.?C\.?A)', re.IGNORECASE)

        cgpa_match = cgpa_pattern.search(text)
        degree_match = degree_pattern.search(text)

        entry = {
            "raw": text[:500],
            "degree": degree_match.group(1) if degree_match else None,
            "cgpa": float(cgpa_match.group(1)) if cgpa_match else None,
            "cgpa_scale": float(cgpa_match.group(2)) if cgpa_match and cgpa_match.group(2) else 10.0,
        }
        entries.append(entry)
        return entries

    def _extract_experience(self, text: str) -> list[dict]:
        """Extract work experience entries."""
        if not text:
            return []
        # Simple extraction — split by common patterns
        entries = []
        blocks = re.split(r'\n(?=[A-Z])', text)
        for block in blocks[:5]:
            if len(block.strip()) > 20:
                entries.append({"raw": block.strip()[:500]})
        return entries

    def _extract_projects(self, text: str) -> list[dict]:
        """Extract project entries — group bullet descriptions under titles."""
        if not text:
            return []
        # Short standalone labels to skip (link text from resumes)
        skip_labels = {"github", "live demo", "view project", "demo", "link",
                       "source code", "view certificate", "certificate", "linkedin"}
        projects: list[dict] = []
        current: dict | None = None
        for line in text.split("\n"):
            stripped = line.strip()
            if not stripped or len(stripped) < 5:
                continue
            # Bullet point → append to current project
            if stripped[0] in "•●-*" or stripped.startswith("–"):
                if current is not None:
                    current["description"].append(stripped.lstrip("•●-* –"))
                continue
            # Skip standalone link labels
            if stripped.lower() in skip_labels:
                continue
            # Non-bullet line → new project title
            if current is not None:
                projects.append(current)
            current = {"name": stripped[:200], "description": []}
        if current is not None:
            projects.append(current)
        return projects[:20]

    def _extract_certifications(self, text: str) -> list[str]:
        """Extract certification names."""
        if not text:
            return []
        certs = []
        for line in text.split("\n"):
            line = line.strip().lstrip("•●-* ")
            if len(line) > 5:
                certs.append(line[:200])
        return certs[:10]

    def _extract_contact(self, text: str) -> dict:
        """Extract contact info from full resume text."""
        email_pattern = re.compile(r'[\w.+-]+@[\w-]+\.[\w.]+')
        phone_pattern = re.compile(r'[\+]?[\d\s\-\(\)]{10,15}')
        github_pattern = re.compile(r'github\.com/([\w-]+)', re.IGNORECASE)
        linkedin_pattern = re.compile(r'linkedin\.com/in/([\w-]+)', re.IGNORECASE)

        first_500 = text[:500]

        return {
            "email": email_pattern.search(first_500).group() if email_pattern.search(first_500) else None,
            "phone": phone_pattern.search(first_500).group().strip() if phone_pattern.search(first_500) else None,
            "github": github_pattern.search(text).group(1) if github_pattern.search(text) else None,
            "linkedin": linkedin_pattern.search(text).group(1) if linkedin_pattern.search(text) else None,
        }
