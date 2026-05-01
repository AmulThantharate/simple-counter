pipeline {
  agent any

  tools {
      nodejs "node25" 
  }
  parameters {
    string(name: 'IMAGE_TAG', defaultValue: '', description: 'Image tag from orchestrator')
  }

  environment {
    SONAR_HOME = tool "sonar"

    IMAGE_NAME          = 'claw4321/simple-counter'
    DOCKER_REGISTRY_URL = 'https://index.docker.io/v1/'
    TRIVY_SEVERITY      = 'HIGH,CRITICAL'
    TRIVY_EXIT_CODE     = '0'
    SYFT_FORMAT         = "spdx-json"
  }

  stages{
    stage("Checkout"){
      steps {
        git branch: "main", url: "https://github.com/AmulThantharate/simple-counter.git"
      }
    }

    stage("Image Tag"){
      steps{
        script{
          if (params.IMAGE_TAG?.trim()){
            env.IMAGE_TAG = params.IMAGE_TAG
          } else {
            env.IMAGE_TAG = sh(script: 'git log -1 --format="%h"', returnStdout: true).trim()
          }
          echo "USING IMAGE_TAG = ${env.IMAGE_TAG}"
        }
      }
    }

    stage("Install Dependencies") {
      steps {
        sh '''
          echo "=== Installing Dependencies ==="
          rm -rf node_modules
          npm install --no-audit
        '''
      }
    }

    stage("Lint") {
      steps {
        sh '''
          echo "=== Linting ==="
          npm run lint
        '''
      }
    }

    stage("Test"){
      steps{
        sh '''
          echo "=== Running Tests ==="
          npm run test
        '''
      }
    }

    stage("Somke Test"){
      steps{
        sh """
          npm run test:smoke
          """
      }
    }

    stage('SonarQube Analysis') {
      steps {
          withSonarQubeEnv('sonar') {
            sh """
              ${SONAR_HOME}/bin/sonar-scanner \
              -Dsonar.projectName='xo-arena' \
              -Dsonar.projectKey='xo-arena' \
              -Dsonar.sources=. \
              -Dsonar.tests=. \
              -Dsonar.test.inclusions=**/*.test.js,**/*.spec.js \
              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
              -Dsonar.coverage.exclusions=**/*.test.js,**/*.spec.js,**/node_modules/**
            """
        }
      }
    }

    stage("Quality Gate"){
      steps{
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage("Trivy File System Scan") {
      steps {
        sh "mkdir -p reports && trivy fs --format table -o reports/trivy-fs-report.html ."
      }
      post {
        always {
          publishHTML([
            allowMissing: false,
            alwaysLinkToLastBuild: true,
            keepAll: true,
            reportDir: 'reports/',
            reportFiles: 'trivy-fs-report.html',
            reportName: 'Trivy FS Scan'
          ])
        }
      }
    }

    stage("Confest Policy Check") {
      steps{
        sh """
          confest test k8s/ --policy policy/
        """
      }
    }

    stage("Docker Build"){
      steps{
        sh """
          docker build \
          --build-arg NODE_ENV=production \
          --cache-from ${IMAGE_NAME}:latest \
          -t ${IMAGE_NAME}:${IMAGE_TAG} \
          -t ${IMAGE_NAME}:latest \
          .
        """
      }
    }

    stage('Security Scans') {
      parallel {

        stage('Trivy Image Scan') {
          steps {
            sh """
              trivy image \
                --severity ${TRIVY_SEVERITY} \
                --exit-code ${TRIVY_EXIT_CODE} \
                ${IMAGE_NAME}:${IMAGE_TAG}
            """
          }
        }

        stage('Syft SBOM') {
          steps {
            sh """
              syft ${IMAGE_NAME}:${IMAGE_TAG} \
              -o ${SYFT_FORMAT} > syft-frontend-sbom.json
            """
            archiveArtifacts artifacts: 'syft-frontend-sbom.json', allowEmptyArchive: true
          }
        }
      }
    }

    stage("Docker Push") {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'DOCKER_CRED',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh '''
            echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
            docker push $IMAGE_NAME:$IMAGE_TAG
          '''
        }
      }
    }

    stage("Update Manifest for ArgoCD") {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'GIT_CRED',
          usernameVariable: 'GIT_USER',
          passwordVariable: 'GIT_PASS'
      )]) {
          sh '''
              echo "=== Updating Kubernetes Manifest ==="

              rm -rf deploy-repo || true

              git clone https://$GIT_USER:$GIT_PASS@github.com/AmulThantharate/simple-counter.git deploy-repo
              cd deploy-repo/k8s

              # Update image tag
              sed -i "s|image: claw4321/simple-counter:.*|image: claw4321/simple-counter:${IMAGE_TAG}|g" deployment.yaml

              cd ..
              git config user.email "jenkins@local"
              git config user.name "jenkins"

              git add k8s/deployment.yaml
              git commit -m "Update image to ${IMAGE_TAG}" || echo "No changes"
              git push
'''
        }
      }
    }
  }
  post {
    always {
      cleanWs()
    }
  }
}