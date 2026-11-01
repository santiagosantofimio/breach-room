FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src src
RUN mvn -B -q -DskipTests package
RUN java -Djarmode=tools -jar target/breach-room.jar extract --destination /extracted

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S breach && adduser -S breach -G breach
WORKDIR /app
COPY --from=build /extracted/ ./
RUN FLAG_SECRET=cds-training-run-placeholder-not-a-secret \
    SESSION_SECRET=cds-training-run-placeholder-not-a-secret \
    ALLOWED_ORIGIN=http://cds-training.invalid \
    java -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k \
    -XX:ArchiveClassesAtExit=app.jsa -Dspring.context.exit=onRefresh -jar breach-room.jar
USER breach
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1", "-Xss512k", "-XX:SharedArchiveFile=app.jsa", "-jar", "breach-room.jar"]
