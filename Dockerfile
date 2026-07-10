FROM python:3.13-slim AS runtime
RUN useradd --create-home --uid 10001 appuser
WORKDIR /app
COPY pyproject.toml README.md ./
COPY src ./src
RUN python -m pip install --no-cache-dir .
COPY policy.toml ./policy.toml
COPY scripts ./scripts
COPY specs ./specs
RUN mkdir -p /app/runtime && chown -R appuser:appuser /app
USER appuser
ENTRYPOINT ["codex-hitl"]
CMD ["status"]
