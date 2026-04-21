pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "vivekchunchu/karnics-deploy"
        DOCKER_TAG = "${BUILD_NUMBER}"
        SONARQUBE_ENV = "SonarQubeServer"
    }

    stages {

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test || true'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv("${SONARQUBE_ENV}") {
                    sh 'sonar-scanner'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $DOCKER_IMAGE:$DOCKER_TAG .'
                sh 'docker tag $DOCKER_IMAGE:$DOCKER_TAG $DOCKER_IMAGE:latest'
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([string(credentialsId: 'dockerhub-pass', variable: 'PASS')]) {
                    sh '''
                    echo $PASS | docker login -u sunardock --Sunar@#doc123-stdin
                    docker push $DOCKER_IMAGE:$DOCKER_TAG
                    docker push $DOCKER_IMAGE:latest
                    '''
                }
            }
        }

        stage('Deploy Container') {
            steps {
                sh '''
                docker stop karnics-app || true
                docker rm karnics-app || true
                docker run -d -p 3000:3000 --name karnics-app $DOCKER_IMAGE:latest
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Build & Deployment Successful!"
        }
        failure {
            echo "❌ Pipeline Failed!"
        }
    }
}
