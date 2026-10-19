# Build + run the app on Render (or any Docker host).
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
RUN chmod +x mvnw && ./mvnw -q clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# PORT is provided by Render; DB_URL / DB_USERNAME / DB_PASSWORD / MANAGER_PASSWORD come from environment variables.
ENTRYPOINT ["java", "-jar", "app.jar"]
